"""
payment_routes.py

Payment endpoints for OPC Genie — dual-gateway: Razorpay (primary, India) and
Stripe (international).

Flow summary
------------
Client                         Backend                        Gateway
  |                               |                              |
  | POST /api/payments/create-order (offer_id / plan)           |
  |------------------------------>|                              |
  |                               |--- create order/intent ----->|
  |                               |<-- order_id / client_secret -|
  |<------ {order_id, key, …} ----|                              |
  |                               |                              |
  | (user completes payment in UI via Razorpay / Stripe JS SDK)  |
  |                               |                              |
  | POST /api/payments/verify (Razorpay) or handled by webhook   |
  |------------------------------>|                              |
  |                               |--- verify signature -------->|
  |<------ {success: true} -------|                              |

Webhooks arrive at:
  POST /api/payments/webhook/razorpay
  POST /api/payments/webhook/stripe
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.auth import AuthService
from app.core.config import settings
from app.core.database import get_db
from app.models.offer import Offer, OfferStatus, OfferType
from app.api.routes.community_routes import grant_community_membership_for_offer
from app.models.subscription import (
    BillingCycle,
    Payment,
    PaymentGateway,
    PaymentPurpose,
    PaymentStatus,
    PlanTier,
    SubscriptionStatus,
    UserSubscription,
)
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Plan pricing table (INR / USD paise / cents)
# ---------------------------------------------------------------------------

PLAN_PRICES: dict[str, dict[str, dict]] = {
    "razorpay": {
        # amounts in paise (1 INR = 100 paise)
        "pro_monthly":   {"amount": 199900,  "currency": "INR"},
        "pro_annual":    {"amount": 1999900, "currency": "INR"},
        "enterprise_monthly": {"amount": 499900,  "currency": "INR"},
        "enterprise_annual":  {"amount": 4999900, "currency": "INR"},
    },
    "stripe": {
        # amounts in cents (1 USD = 100 cents)
        "pro_monthly":   {"amount": 2900,  "currency": "usd"},
        "pro_annual":    {"amount": 29000, "currency": "usd"},
        "enterprise_monthly": {"amount": 6900,  "currency": "usd"},
        "enterprise_annual":  {"amount": 69000, "currency": "usd"},
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_current_user(request: Request, db: Session) -> Optional[User]:
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
    if not token:
        token = request.cookies.get("token")
    if not token:
        return None
    return AuthService.get_user_from_token(token, db)


def _require_user(request: Request, db: Session) -> User:
    user = _get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return user


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class CreateOrderRequest(BaseModel):
    purpose: str                     # "offer" | "subscription"
    offer_id: Optional[int] = None
    plan: Optional[str] = None       # "pro" | "enterprise"
    billing_cycle: Optional[str] = "monthly"   # "monthly" | "annual"
    gateway: str = "razorpay"        # "razorpay" | "stripe"


class VerifyPaymentRequest(BaseModel):
    gateway_order_id: str
    gateway_payment_id: str
    gateway_signature: str           # Razorpay only


class CreateOrderResponse(BaseModel):
    payment_id: int                  # internal Payment row id
    gateway: str
    order_id: str                    # Razorpay order_id OR Stripe PaymentIntent id
    amount: float
    currency: str
    # Razorpay
    razorpay_key_id: Optional[str] = None
    # Stripe
    stripe_publishable_key: Optional[str] = None
    client_secret: Optional[str] = None


# ---------------------------------------------------------------------------
# POST /api/payments/create-order
# ---------------------------------------------------------------------------

@router.post("/payments/create-order", response_model=CreateOrderResponse)
async def create_order(
    body: CreateOrderRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """Create a payment order/intent on the chosen gateway."""
    user = _require_user(request, db)

    gateway = body.gateway.lower()
    if gateway not in ("razorpay", "stripe"):
        raise HTTPException(status_code=400, detail="gateway must be 'razorpay' or 'stripe'")

    # ---- Resolve amount & currency ----------------------------------------
    amount_minor: int   # smallest currency unit
    currency: str
    offer: Optional[Offer] = None
    plan_tier: Optional[PlanTier] = None
    billing_cycle: Optional[BillingCycle] = None

    if body.purpose == "offer":
        if not body.offer_id:
            raise HTTPException(status_code=400, detail="offer_id required for purpose='offer'")
        offer = db.query(Offer).filter(Offer.id == body.offer_id, Offer.status == OfferStatus.PUBLISHED).first()
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found or not published")
        if not offer.price:
            raise HTTPException(status_code=400, detail="This offer is free — no payment needed")
        price_inr = float(offer.price)
        if gateway == "razorpay":
            amount_minor = int(price_inr * 100)
            currency = "INR"
        else:
            # rough USD conversion for Stripe (replace with live FX in production)
            amount_minor = int(price_inr * 1.2)   # placeholder: 1 USD ≈ 83 INR → ~1.2 cents per paise
            currency = "usd"

    elif body.purpose == "subscription":
        if not body.plan:
            raise HTTPException(status_code=400, detail="plan required for purpose='subscription'")
        cycle = body.billing_cycle or "monthly"
        key = f"{body.plan}_{cycle}"
        price_table = PLAN_PRICES.get(gateway, {})
        if key not in price_table:
            raise HTTPException(status_code=400, detail=f"Unknown plan/cycle: {key}")
        amount_minor = price_table[key]["amount"]
        currency = price_table[key]["currency"]
        plan_tier = PlanTier(body.plan)
        billing_cycle = BillingCycle(cycle)
    else:
        raise HTTPException(status_code=400, detail="purpose must be 'offer' or 'subscription'")

    # ---- Create gateway order ---------------------------------------------
    gateway_order_id: str
    client_secret: Optional[str] = None

    if gateway == "razorpay":
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            raise HTTPException(status_code=503, detail="Razorpay is not configured")
        try:
            import razorpay  # type: ignore
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            order = client.order.create({
                "amount": amount_minor,
                "currency": currency,
                "receipt": f"opc_{user.id}_{body.purpose[:3]}",
                "payment_capture": 1,
            })
            gateway_order_id = order["id"]
        except Exception as exc:
            logger.error("Razorpay order creation failed: %s", exc)
            raise HTTPException(status_code=502, detail="Payment gateway error — please try again")

    else:  # stripe
        if not settings.STRIPE_SECRET_KEY:
            raise HTTPException(status_code=503, detail="Stripe is not configured")
        try:
            import stripe  # type: ignore
            stripe.api_key = settings.STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.create(
                amount=amount_minor,
                currency=currency,
                metadata={"user_id": str(user.id), "purpose": body.purpose},
            )
            gateway_order_id = intent["id"]
            client_secret = intent["client_secret"]
        except Exception as exc:
            logger.error("Stripe PaymentIntent creation failed: %s", exc)
            raise HTTPException(status_code=502, detail="Payment gateway error — please try again")

    # ---- Persist Payment row ----------------------------------------------
    amount_display = amount_minor / 100
    payment = Payment(
        user_id=user.id,
        purpose=PaymentPurpose(body.purpose),
        offer_id=offer.id if offer else None,
        gateway=PaymentGateway(gateway),
        status=PaymentStatus.CREATED,
        gateway_order_id=gateway_order_id,
        amount=amount_display,
        currency=currency.upper(),
        customer_email=user.email,
        customer_name=user.full_name,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    return CreateOrderResponse(
        payment_id=payment.id,
        gateway=gateway,
        order_id=gateway_order_id,
        amount=amount_display,
        currency=currency.upper(),
        razorpay_key_id=settings.RAZORPAY_KEY_ID if gateway == "razorpay" else None,
        stripe_publishable_key=settings.STRIPE_PUBLISHABLE_KEY if gateway == "stripe" else None,
        client_secret=client_secret,
    )


# ---------------------------------------------------------------------------
# POST /api/payments/verify  (Razorpay client-side callback)
# ---------------------------------------------------------------------------

@router.post("/payments/verify")
async def verify_razorpay_payment(
    body: VerifyPaymentRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Verify Razorpay payment signature after the client-side checkout succeeds.
    Marks the Payment row as captured and, for subscriptions, upserts UserSubscription.
    """
    user = _require_user(request, db)

    payment = db.query(Payment).filter(
        Payment.gateway_order_id == body.gateway_order_id,
        Payment.user_id == user.id,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    # Verify HMAC-SHA256 signature: order_id|payment_id
    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Razorpay not configured")

    msg = f"{body.gateway_order_id}|{body.gateway_payment_id}".encode()
    expected = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, body.gateway_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Update Payment row
    payment.status = PaymentStatus.CAPTURED
    payment.gateway_payment_id = body.gateway_payment_id
    payment.gateway_signature = body.gateway_signature
    db.add(payment)

    # If this was a subscription purchase, upsert UserSubscription
    if payment.purpose == PaymentPurpose.SUBSCRIPTION:
        _upsert_subscription(user.id, payment, db)

    db.commit()
    return {"success": True, "payment_id": payment.id}


# ---------------------------------------------------------------------------
# POST /api/payments/webhook/razorpay
# ---------------------------------------------------------------------------

@router.post("/payments/webhook/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Razorpay webhook — handles payment.captured and subscription events."""
    body_bytes = await request.body()

    # Signature verification
    if settings.RAZORPAY_WEBHOOK_SECRET:
        sig = request.headers.get("X-Razorpay-Signature", "")
        expected = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        event = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("event", "")
    logger.info("Razorpay webhook: %s", event_type)

    if event_type == "payment.captured":
        payload = event.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payload.get("order_id")
        payment_id = payload.get("id")
        if order_id:
            row = db.query(Payment).filter(Payment.gateway_order_id == order_id).first()
            if row and row.status != PaymentStatus.CAPTURED:
                row.status = PaymentStatus.CAPTURED
                row.gateway_payment_id = payment_id
                row.raw_payload = body_bytes.decode()
                if row.purpose == PaymentPurpose.SUBSCRIPTION:
                    user = db.query(User).filter(User.id == row.user_id).first()
                    if user:
                        _upsert_subscription(user.id, row, db)
                elif row.purpose == PaymentPurpose.OFFER and row.offer_id and row.user_id:
                    offer = db.query(Offer).filter(Offer.id == row.offer_id).first()
                    if offer and offer.offer_type == OfferType.COMMUNITY:
                        grant_community_membership_for_offer(row.offer_id, row.user_id, row.id, db)
                db.add(row)
                db.commit()

    elif event_type == "payment.failed":
        payload = event.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payload.get("order_id")
        if order_id:
            row = db.query(Payment).filter(Payment.gateway_order_id == order_id).first()
            if row:
                row.status = PaymentStatus.FAILED
                row.raw_payload = body_bytes.decode()
                db.add(row)
                db.commit()

    elif event_type == "subscription.cancelled":
        sub_payload = event.get("payload", {}).get("subscription", {}).get("entity", {})
        gateway_sub_id = sub_payload.get("id")
        if gateway_sub_id:
            sub = db.query(UserSubscription).filter(
                UserSubscription.gateway_subscription_id == gateway_sub_id
            ).first()
            if sub:
                sub.status = SubscriptionStatus.CANCELLED
                sub.cancelled_at = datetime.now(timezone.utc)
                db.add(sub)
                db.commit()

    return {"received": True}


# ---------------------------------------------------------------------------
# POST /api/payments/webhook/stripe
# ---------------------------------------------------------------------------

@router.post("/payments/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Stripe webhook — handles payment_intent.succeeded and subscription events."""
    body_bytes = await request.body()

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    # Stripe signature verification
    if settings.STRIPE_WEBHOOK_SECRET:
        try:
            import stripe  # type: ignore
            stripe.api_key = settings.STRIPE_SECRET_KEY
            sig_header = request.headers.get("Stripe-Signature", "")
            event = stripe.Webhook.construct_event(
                body_bytes, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Webhook signature verification failed: {exc}")
    else:
        try:
            event = json.loads(body_bytes)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event_type = event.get("type", "") if isinstance(event, dict) else event["type"]
    logger.info("Stripe webhook: %s", event_type)

    if event_type == "payment_intent.succeeded":
        pi = event["data"]["object"] if isinstance(event, dict) else event.data.object
        pi_id = pi["id"] if isinstance(pi, dict) else pi.id
        row = db.query(Payment).filter(Payment.gateway_order_id == pi_id).first()
        if row and row.status != PaymentStatus.SUCCEEDED:
            row.status = PaymentStatus.SUCCEEDED
            row.raw_payload = body_bytes.decode()
            if row.purpose == PaymentPurpose.SUBSCRIPTION:
                _upsert_subscription(row.user_id, row, db)
            elif row.purpose == PaymentPurpose.OFFER and row.offer_id and row.user_id:
                offer = db.query(Offer).filter(Offer.id == row.offer_id).first()
                if offer and offer.offer_type == OfferType.COMMUNITY:
                    grant_community_membership_for_offer(row.offer_id, row.user_id, row.id, db)
            db.add(row)
            db.commit()

    elif event_type == "payment_intent.payment_failed":
        pi = event["data"]["object"] if isinstance(event, dict) else event.data.object
        pi_id = pi["id"] if isinstance(pi, dict) else pi.id
        row = db.query(Payment).filter(Payment.gateway_order_id == pi_id).first()
        if row:
            row.status = PaymentStatus.FAILED
            row.raw_payload = body_bytes.decode()
            db.add(row)
            db.commit()

    elif event_type == "customer.subscription.deleted":
        sub_obj = event["data"]["object"] if isinstance(event, dict) else event.data.object
        stripe_sub_id = sub_obj["id"] if isinstance(sub_obj, dict) else sub_obj.id
        sub = db.query(UserSubscription).filter(
            UserSubscription.gateway_subscription_id == stripe_sub_id
        ).first()
        if sub:
            sub.status = SubscriptionStatus.CANCELLED
            sub.cancelled_at = datetime.now(timezone.utc)
            db.add(sub)
            db.commit()

    return {"received": True}


# ---------------------------------------------------------------------------
# GET /api/payments/subscription  — current user's subscription
# ---------------------------------------------------------------------------

@router.get("/payments/subscription")
async def get_my_subscription(request: Request, db: Session = Depends(get_db)):
    """Return the authenticated user's current subscription (or free tier defaults)."""
    user = _require_user(request, db)
    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user.id).first()
    if not sub:
        return {
            "plan": PlanTier.FREE.value,
            "status": SubscriptionStatus.ACTIVE.value,
            "billing_cycle": None,
            "current_period_end": None,
        }
    return sub.to_dict()


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _upsert_subscription(
    user_id: int,
    payment: Payment,
    db: Session,
) -> None:
    """Create or update a UserSubscription row after a successful payment."""
    from datetime import timedelta

    sub = db.query(UserSubscription).filter(UserSubscription.user_id == user_id).first()
    now = datetime.now(timezone.utc)

    # Determine plan from payment amount / currency heuristic.
    # In production, encode plan/tier in Payment.raw_payload or a separate column.
    plan = PlanTier.PRO   # default; refine with actual plan lookup

    if sub is None:
        sub = UserSubscription(
            user_id=user_id,
            plan=plan,
            billing_cycle=BillingCycle.MONTHLY,
            status=SubscriptionStatus.ACTIVE,
            gateway=payment.gateway,
            current_period_start=now,
            current_period_end=now + timedelta(days=30),
        )
    else:
        sub.plan = plan
        sub.status = SubscriptionStatus.ACTIVE
        sub.gateway = payment.gateway
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=30)

    payment.subscription_id = sub.id  # linked after flush
    db.add(sub)

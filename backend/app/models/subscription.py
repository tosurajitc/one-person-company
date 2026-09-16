"""
subscription.py — UserSubscription and Payment models.

UserSubscription  tracks a user's active plan (free / pro / enterprise).
Payment           records every individual payment transaction against an offer
                  or a platform subscription, regardless of gateway.
"""

from __future__ import annotations

import enum
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean,
    DateTime, ForeignKey, Enum as SAEnum,
)
from sqlalchemy.sql import func
from app.core.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class PlanTier(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    ANNUAL = "annual"
    LIFETIME = "lifetime"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    TRIALING = "trialing"
    EXPIRED = "expired"


class PaymentGateway(str, enum.Enum):
    RAZORPAY = "razorpay"
    STRIPE = "stripe"


class PaymentStatus(str, enum.Enum):
    CREATED = "created"
    PENDING = "pending"
    CAPTURED = "captured"       # Razorpay term
    SUCCEEDED = "succeeded"     # Stripe term
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentPurpose(str, enum.Enum):
    OFFER = "offer"              # one-time purchase of a founder's offer
    SUBSCRIPTION = "subscription"  # platform plan upgrade


# ---------------------------------------------------------------------------
# UserSubscription
# ---------------------------------------------------------------------------

class UserSubscription(Base):
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True, unique=True)

    plan = Column(SAEnum(PlanTier), default=PlanTier.FREE, nullable=False)
    billing_cycle = Column(SAEnum(BillingCycle), default=BillingCycle.MONTHLY, nullable=False)
    status = Column(SAEnum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE, nullable=False)

    # Gateway-specific subscription / customer IDs
    gateway = Column(SAEnum(PaymentGateway), nullable=True)
    gateway_subscription_id = Column(String(255), nullable=True, index=True)
    gateway_customer_id = Column(String(255), nullable=True)

    # Billing dates
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    trial_end = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "plan": self.plan.value,
            "billing_cycle": self.billing_cycle.value,
            "status": self.status.value,
            "gateway": self.gateway.value if self.gateway else None,
            "current_period_start": self.current_period_start.isoformat() if self.current_period_start else None,
            "current_period_end": self.current_period_end.isoformat() if self.current_period_end else None,
            "trial_end": self.trial_end.isoformat() if self.trial_end else None,
            "cancelled_at": self.cancelled_at.isoformat() if self.cancelled_at else None,
        }


# ---------------------------------------------------------------------------
# Payment
# ---------------------------------------------------------------------------

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    purpose = Column(SAEnum(PaymentPurpose), nullable=False)
    offer_id = Column(Integer, ForeignKey("offers.id", ondelete="SET NULL"), nullable=True, index=True)
    subscription_id = Column(Integer, ForeignKey("user_subscriptions.id", ondelete="SET NULL"), nullable=True)

    gateway = Column(SAEnum(PaymentGateway), nullable=False)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.CREATED, nullable=False)

    # Gateway identifiers
    gateway_order_id = Column(String(255), nullable=True, index=True)    # Razorpay order_id / Stripe PaymentIntent id
    gateway_payment_id = Column(String(255), nullable=True, index=True)  # Razorpay payment_id / Stripe charge id
    gateway_signature = Column(String(512), nullable=True)               # Razorpay signature for verification

    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), nullable=False, default="INR")

    # Customer info snapshot (denormalised for receipts)
    customer_email = Column(String(255), nullable=True)
    customer_name = Column(String(255), nullable=True)

    # Raw webhook / callback payload for audit
    raw_payload = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "purpose": self.purpose.value,
            "offer_id": self.offer_id,
            "gateway": self.gateway.value,
            "status": self.status.value,
            "gateway_order_id": self.gateway_order_id,
            "gateway_payment_id": self.gateway_payment_id,
            "amount": float(self.amount),
            "currency": self.currency,
            "customer_email": self.customer_email,
            "customer_name": self.customer_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

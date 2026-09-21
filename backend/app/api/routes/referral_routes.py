"""
Referral Programme Routes
GET  /api/referral/stats  — return the current user's referral code + referred-user count
POST /api/referral/apply  — (optional) let a new user supply the referral code they used
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User, _generate_referral_code

router = APIRouter(prefix="/referral", tags=["referral"])

COMMISSION_PERCENT = 20  # lifetime commission percentage shown in the UI


class ReferralStatsResponse(BaseModel):
    referral_code: str
    referral_link: str
    referred_count: int
    commission_percent: int
    pending_earnings: float   # placeholder — real earnings require a billing integration
    lifetime_earnings: float  # placeholder


class ApplyReferralRequest(BaseModel):
    referral_code: str


@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's referral code and how many users signed up through it."""
    # Lazily assign a code if the user pre-dates this feature
    if not current_user.referral_code:
        current_user.referral_code = _generate_referral_code()
        db.commit()
        db.refresh(current_user)

    referred_count = (
        db.query(User)
        .filter(User.referred_by_code == current_user.referral_code)
        .count()
    )

    return ReferralStatsResponse(
        referral_code=current_user.referral_code,
        referral_link=f"https://opcgenie.com/?ref={current_user.referral_code}",
        referred_count=referred_count,
        commission_percent=COMMISSION_PERCENT,
        # Earnings calculations require payment/billing data — surfaced as 0 until
        # a billing integration is wired in.
        pending_earnings=0.0,
        lifetime_earnings=0.0,
    )


@router.post("/apply", status_code=status.HTTP_200_OK)
async def apply_referral_code(
    payload: ApplyReferralRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Let a user retrospectively attach the referral code they signed up with."""
    if current_user.referred_by_code:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A referral code has already been applied to this account.",
        )

    referrer = (
        db.query(User)
        .filter(User.referral_code == payload.referral_code)
        .first()
    )
    if not referrer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral code not found.",
        )
    if referrer.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot use your own referral code.",
        )

    current_user.referred_by_code = payload.referral_code
    db.commit()
    return {"success": True, "message": "Referral code applied successfully."}

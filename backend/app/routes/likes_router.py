from fastapi import APIRouter, Depends, Request, Query
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.meals_likes_schemas import LikeToggleRequest
from app.schemas.common_schemas import CommonResponse
from app.services import meals_likes_service
router = APIRouter()

@router.get("/list")
def list_feed_likes(request: Request, limit: int = Query(30, ge=1), offset: int = Query(0, ge=0), db: Session = Depends(get_db)):
    """
    좋아요 리스트
    """
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return meals_likes_service.meal_like_list(db, user_hash, limit, offset)

@router.post("/toggle")
def toggle_feed_like(request: Request, body: LikeToggleRequest, db: Session = Depends(get_db)):
    """
    피드 좋아요 토글
    """
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return meals_likes_service.toggle_feed_like(db, user_hash, body)

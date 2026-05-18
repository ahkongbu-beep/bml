from fastapi import APIRouter, Depends, Request, Query, Body
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse
from app.schemas.growths_schemas import GrowthsListRequest, GrowthReportSaveRequest
from app.services import growths_service
router = APIRouter()

@router.get("/list")
def list_feed_likes(request: Request, body: GrowthsListRequest = Depends(), db: Session = Depends(get_db)):
    """
    성장리스트
    """
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return growths_service.get_growth_list(db, user_hash, body)

@router.post("/reports/{child_id}")
def create_growth_report(request: Request, child_id: int, body: GrowthReportSaveRequest = Body(...), db: Session = Depends(get_db)):
    """
    성장리포트 추가
    """
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return growths_service.create_growth_report(db, user_hash, child_id, body)

@router.get("/reports/{child_id}")
def get_growth_report(request: Request, child_id: int, db: Session = Depends(get_db)):
    """
    성장리포트 조회
    """
    user_hash = getattr(request.state, "user_hash", None)
    if not user_hash:
        return CommonResponse(success=False, error="인증이 필요합니다.", data=None)

    return growths_service.get_growth_report(db, user_hash, child_id)
from fastapi import APIRouter, Depends, Request, Query
from app.services import notices_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.notices_schemas import NoticesCreateRequest
from app.schemas.common_schemas import CommonResponse
router = APIRouter()

@router.get("/list")
def list_notices(db: Session = Depends(get_db)):
    return notices_service.list_notices(db)

@router.get("/detail/{view_hash}")
def notice_detail(view_hash: str, db: Session = Depends(get_db)):
    if not view_hash or view_hash.strip() == "":
        return CommonResponse(success=False, error="유효하지 않은 공지사항 식별자입니다.", data=None)

    return notices_service.notice_detail(db, view_hash)

@router.post("/create")
def create_notice(notice: NoticesCreateRequest, request: Request, db: Session = Depends(get_db)):
    # Placeholder for notice creation logic
    client_ip = request.client.host
    return notices_service.create_notice(notice, client_ip, db)
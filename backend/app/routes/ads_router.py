"""
광고주 관리 라우터
"""
from fastapi import APIRouter, Depends, Request, Query, Path
from fastapi import File, UploadFile
from app.services import ads_service
from app.schemas.ads_schemas import AdsAddRequest, AdsListRequest
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse

router = APIRouter()

@router.post("/add")
async def add_ads(
    db: Session = Depends(get_db),
    body: AdsAddRequest = Depends(AdsAddRequest.as_form),
    image_files: list[UploadFile] = File(None),
):
    return await ads_service.add_ads(db, body, image_files)

@router.put("/edit/{view_hash}")
async def edit_ads(
    view_hash: str = Path(..., description="광고 식별 해시"),
    db: Session = Depends(get_db),
    body: AdsAddRequest = Depends(AdsAddRequest.as_form),
    image_files: list[UploadFile] = File(None),
):
    return await ads_service.edit_ads(db, view_hash, body, image_files)

@router.get("/list")
async def get_ads_list(
    db: Session = Depends(get_db),
    body: AdsListRequest = Depends(AdsListRequest),
):
    return ads_service.get_ads_list(db, body)

@router.post("/click/{view_hash}")
async def click_ad(
    request: Request,
    view_hash: str = Path(..., description="광고 식별 해시"),
    db: Session = Depends(get_db),
):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, message="로그인이 필요합니다.")

    ip = request.client.host
    user_agent = request.headers.get("user-agent", "")

    return await ads_service.click_ad(db, user_hash, view_hash, ip, user_agent)
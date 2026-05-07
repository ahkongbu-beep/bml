"""
광고주 관리 라우터
"""
from fastapi import APIRouter, Depends, Request, Query, Path
from fastapi import File, UploadFile
from app.services import advertiser_service
from app.schemas.advertiser_schemas import AdvertiserAddRequest, AdvertiserListRequest
from app.core.database import get_db
from sqlalchemy.orm import Session
router = APIRouter()

@router.post("/add")
async def add_advertiser(
    db: Session = Depends(get_db),
    body: AdvertiserAddRequest = Depends(AdvertiserAddRequest.as_form),
    account_image: UploadFile = File(None),
):
    return await advertiser_service.add_advertiser(db, body, account_image)

@router.put("/edit/{view_hash}")
async def edit_advertiser(
    db: Session = Depends(get_db),
    view_hash: str = Path(..., description="광고주 해시"),
    body: AdvertiserAddRequest = Depends(AdvertiserAddRequest.as_form),
    account_image: UploadFile = File(None),
):
    return await advertiser_service.edit_advertiser(db, view_hash, body, account_image)

@router.get("/detail/{view_hash}")
async def get_advertiser_hash(
    db: Session = Depends(get_db),
    view_hash: str = Path(..., description="광고주 해시")
):
    return advertiser_service.get_advertiser_hash(db, view_hash)

@router.get("/list")
async def get_advertiser_list(
    db: Session = Depends(get_db),
    body: AdvertiserListRequest = Depends(AdvertiserListRequest),
):
    return advertiser_service.get_advertiser_list(db, body)
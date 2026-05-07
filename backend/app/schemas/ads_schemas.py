from pydantic import BaseModel, EmailStr
from typing import Optional
from fastapi import Form, Query, UploadFile


class AdsItemSchema(BaseModel):
    advertiser_id: int
    amount: int
    start_date: str
    end_date: str
    contents: Optional[str] = None

class AdsListRequest(BaseModel):
    advertiser_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    page: int = 1
    page_size: int = 50

class AdsAddRequest(BaseModel):
    """
    * 광고주 id
    * 광고비용
    * 시작일
    * 종료일
    * 내용
    """
    advertiser_hash: str
    amount: int
    start_date: str
    end_date: str
    contents: Optional[str] = None
    is_active: Optional[str] = "Y"

    @classmethod
    def as_form(
        cls,
        advertiser_hash: str = Form(...),
        amount: int = Form(...),
        start_date: str = Form(...),
        end_date: str = Form(...),
        target_link: Optional[str] = Form(None),
        contents: Optional[str] = Form(None),
        is_active: Optional[str] = Form("Y"),
    ):
        return cls(
            advertiser_hash=advertiser_hash,
            amount=amount,
            start_date=start_date,
            end_date=end_date,
            target_link=target_link,
            contents=contents,
            is_active=is_active
        )
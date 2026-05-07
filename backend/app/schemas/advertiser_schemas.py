from pydantic import BaseModel, EmailStr
from typing import Optional
from fastapi import Form, Query


class AdvertiserItemSchema(BaseModel):
    account_id: str
    account_name: str
    company: str
    view_hash: str
    account_email: Optional[str] = None
    account_image: Optional[str] = None
    account_tel: Optional[str] = None
    company_number: Optional[str] = None
    company_biz: Optional[str] = None
    company_item: Optional[str] = None
    description: Optional[str] = None

class AdvertiserListRequest(BaseModel):
    company: Optional[str] = None
    account_id: Optional[str] = None
    account_email: Optional[str] = None
    company_number: Optional[str] = None
    page: int = 1
    page_size: int = 50

class AdvertiserAddRequest(BaseModel):
    """
    * 광고주 id
    * 광고주담당자
    * 광고주프로필
    * 광고주회사
    * 담당자 연락처
    * 사업자번호
    업태
    업종
    비고
    """
    account_id: str
    account_name: str
    company: str
    account_image: Optional[str] = None
    account_email: str
    account_tel: Optional[str] = None
    company_number: Optional[str] = None
    company_biz: Optional[str] = None
    company_item: Optional[str] = None
    description: Optional[str] = None

    @classmethod
    def as_form(
        cls,
        account_name: str = Form(...),
        account_id: str = Form(...),
        company: str = Form(...),
        account_email: str = Form(...),
        account_tel: Optional[str] = Form(None),
        company_number: Optional[str] = Form(None),
        company_biz: Optional[str] = Form(None),
        company_item: Optional[str] = Form(None),
        description: str = Form(...),
    ):
        return cls(
            account_name=account_name,
            account_id=account_id,
            company=company,
            account_email=account_email,
            account_tel=account_tel,
            company_number=company_number,
            company_biz=company_biz,
            company_item=company_item,
            description=description,
        )
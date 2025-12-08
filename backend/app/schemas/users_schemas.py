from pydantic import BaseModel, EmailStr, Field, validator
from fastapi import Form
from typing import Optional
from datetime import date, datetime
from enum import Enum

class SnsLoginTypeEnum(str, Enum):
    EMAIL = 'EMAIL'
    KAKAO = 'KAKAO'
    NAVER = 'NAVER'
    GOOGLE = 'GOOGLE'

class GenderEnum(str, Enum):
    M = 'M'
    W = 'W'

class RoleEnum(str, Enum):
    USER = 'USER'
    ADMIN = 'ADMIN'

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserCreateSchema(BaseModel):
    sns_login_type: SnsLoginTypeEnum
    sns_id: Optional[str] = ""
    name: str = Field(..., min_length=2, max_length=50)
    nickname: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = ""
    profile_image: Optional[str] = ""
    description: Optional[str] = ""
    child_birth: Optional[date] = None
    child_gender: GenderEnum = GenderEnum.M
    child_age_group: int = 0
    marketing_agree: Optional[int] = 0
    push_agree: Optional[int] = 0
    view_hash: Optional[str] = None
    role: RoleEnum = RoleEnum.USER

    @classmethod
    def as_form(
        cls,
        sns_login_type: SnsLoginTypeEnum = Form(...),
        sns_id: Optional[str] = Form(""),
        name: str = Form(..., min_length=2, max_length=50),
        nickname: str = Form(..., min_length=2, max_length=50),
        email: Optional[EmailStr] = Form(None),
        password: Optional[str] = Form(None),
        phone: Optional[str] = Form(None),
        address: Optional[str] = Form(""),
        profile_image: Optional[str] = Form(""),
        description: Optional[str] = Form(""),
        child_birth: Optional[date] = Form(None),
        child_gender: GenderEnum = Form(GenderEnum.M),
        child_age_group: int = Form(0),
        marketing_agree: Optional[int] = Form(0),
        push_agree: Optional[int] = Form(0),
        view_hash: Optional[str] = Form(None),
        role: RoleEnum = Form(RoleEnum.USER)
    ):
        return cls(
            sns_login_type=sns_login_type,
            sns_id=sns_id,
            name=name,
            nickname=nickname,
            email=email,
            password=password,
            phone=phone,
            address=address,
            profile_image=profile_image,
            description=description,
            child_birth=child_birth,
            child_gender=child_gender,
            child_age_group=child_age_group,
            marketing_agree=marketing_agree,
            push_agree=push_agree,
            view_hash=view_hash,
            role=role
        )

    @validator('sns_id', always=True)
    def sns_id_required_for_non_email(cls, v, values):
        if values.get('sns_login_type') != SnsLoginTypeEnum.EMAIL and not v:
            raise ValueError('EMAIL 이외의 로그인 시 SNS ID가 필요합니다.')
        return v

    @validator('name', always=True)
    def name_must_not_be_empty(cls, v):
        if not v or v.strip() == "":
            raise ValueError('이름은 필수 항목입니다.')
        return v

    @validator('password', always=True)
    def password_required_for_email(cls, v, values):
        if values.get('sns_login_type') == SnsLoginTypeEnum.EMAIL and not v:
            raise ValueError('EMAIL 로그인 시 비밀번호가 필요합니다.')
        return v

    @validator('phone', always=True)
    def phone_required_for_email(cls, v, values):
        if values.get('sns_login_type') == SnsLoginTypeEnum.EMAIL and not v:
            raise ValueError('EMAIL 로그인 시 휴대폰 번호가 필요합니다.')
        return v

    @validator('email', always=True)
    def email_required_for_email(cls, v, values):
        if values.get('sns_login_type') == SnsLoginTypeEnum.EMAIL and not v:
            raise ValueError('EMAIL 로그인 시 이메일이 필요합니다.')
        return v


class UserResponseSchema(BaseModel):
    """회원 응답 스키마 (비밀번호 제외)"""
    sns_login_type: SnsLoginTypeEnum
    sns_id: str
    address: str
    name: str
    nickname: str
    email: str
    phone: str
    role: RoleEnum
    profile_image: str
    description: Optional[str]
    is_active: int
    child_birth: Optional[date]
    child_gender: GenderEnum
    child_age_group: int
    marketing_agree: int
    push_agree: int
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime
    deleted_at: Optional[datetime]
    view_hash: Optional[str]

    class Config:
        from_attributes = True  # Pydantic v2에서 ORM 모델 자동 변환

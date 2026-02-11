from pydantic import BaseModel, EmailStr, Field, validator
from fastapi import Form
from typing import Optional
from datetime import date, datetime
from enum import Enum

class UserPasswordConfirmRequest(BaseModel):
    token: str
    new_password: str

class UserFindPasswordRequest(BaseModel):
    email: str
    name: str

class UserPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

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

class UserMyInfoRequest(BaseModel):
    user_hash: str

class UserLoginRequest(BaseModel):
    email: str
    password: str

class DenyUserResponse(BaseModel):
    user_hash: str
    nickname: str
    profile_image: Optional[str] = None
    blocked_at: datetime

class SearchUserPasswordConfirmRequest(BaseModel):
    search_type: str  # 'email' or 'phone'
    user_email: Optional[str] = None
    user_phone: Optional[str] = None

class SearchUserAccountConfirmRequest(BaseModel):
    user_name: str
    user_phone: str

class UserChildDeleteRequest(BaseModel):
    child_id: int

class AllergyItemSchema(BaseModel):
    allergy_code: Optional[str] = None
    allergy_name: str

class UserChildItemSchema(BaseModel):
    child_id: Optional[int] = None
    child_name: str
    child_birth: date
    child_gender: GenderEnum
    is_agent: Optional[str]
    allergies: Optional[list[AllergyItemSchema]] = []

class UserChildRegistRequest(BaseModel):
    children: list[UserChildItemSchema]

class UserCreateSchema(BaseModel):
    sns_login_type: SnsLoginTypeEnum
    sns_id: Optional[str] = ""
    name: Optional[str] = None
    profile_image: Optional[str] = None
    nickname: str = Field(..., min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    marketing_agree: Optional[int] = 0
    push_agree: Optional[int] = 0
    view_hash: Optional[str] = None
    role: RoleEnum = RoleEnum.USER
    children: Optional[list[dict]] = []

    @classmethod
    def as_form(
        cls,
        sns_login_type: SnsLoginTypeEnum = Form(...),
        sns_id: Optional[str] = Form(""),
        name: str = Form(..., min_length=2, max_length=50),
        nickname: str = Form(..., min_length=2, max_length=50),
        email: Optional[EmailStr] = Form(None),
        password: Optional[str] = Form(None),
        marketing_agree: Optional[int] = Form(0),
        push_agree: Optional[int] = Form(0),
        view_hash: Optional[str] = Form(None),
        role: RoleEnum = Form(RoleEnum.USER),
        profile_image: Optional[str] = Form(None)
    ):
        return cls(
            sns_login_type=sns_login_type,
            sns_id=sns_id,
            name=name,
            nickname=nickname,
            email=email,
            password=password,
            marketing_agree=marketing_agree,
            push_agree=push_agree,
            view_hash=view_hash,
            role=role,
            profile_image=profile_image
        )

    @validator('sns_id', always=True)
    def sns_id_required_for_non_email(cls, v, values):
        if values.get('sns_login_type') != SnsLoginTypeEnum.EMAIL and not v:
            raise ValueError('EMAIL 이외의 로그인 시 SNS ID가 필요합니다.')
        return v

    @validator('name', always=True)
    def name_must_not_be_empty(cls, v):
        if v and v.strip() == "":
            raise ValueError('이름은 비어있을 수 없습니다.')
        return v

    @validator('password', always=True)
    def password_required_for_email(cls, v, values):
        if values.get('sns_login_type') == SnsLoginTypeEnum.EMAIL and not v:
            raise ValueError('EMAIL 로그인 시 비밀번호가 필요합니다.')
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
    profile_image: Optional[str]
    description: Optional[str]
    is_active: int
    marketing_agree: int
    push_agree: int
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime
    deleted_at: Optional[datetime]
    view_hash: Optional[str]

    class Config:
        from_attributes = True  # Pydantic v2에서 ORM 모델 자동 변환

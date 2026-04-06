from pydantic import BaseModel, EmailStr
from typing import Optional
from app.schemas.notices_schemas import NoticesResponse
from app.schemas.users_schemas import UserResponse
from app.schemas.users_childs_schemas import ChildSchema
from app.schemas.meals_schemas import MealItem

class NoticeListRequest(BaseModel):
    """
    공지사항 리스트 조회 요청 모델
    """
    offset: Optional[int] = 0
    limit: Optional[int] = 30
    category_id: Optional[int] = None
    title: Optional[str] = None
    is_important: Optional[str] = None
    created_at_start: Optional[str] = None
    created_at_end: Optional[str] = None
    updated_at_start: Optional[str] = None
    updated_at_end: Optional[str] = None
    status: Optional[str] = None
    order_by: Optional[str] = None
    order_direction: Optional[str] = None

class NoticeListResponse(BaseModel):
    """
    공지사항 리스트 조회 응답 모델
    """
    total: int
    offset: int
    limit: int
    notice_list: list[NoticesResponse]

class NoticesCreateRequest(BaseModel):
    """
    공지사항 작성 요청
    """
    title: str
    category_id: int
    content: str
    status: str  # active / inactive
    is_important: str # Y / N

class NoticesUpdateRequest(BaseModel):
    """
    공지사항 수정 요청
    """
    title: str
    category_id: int
    content: str
    is_important: str # Y / N
    client_id: Optional[str] = None
    status: str  # active / inactive

class UserListRequest(BaseModel):
    """
    사용자 리스트 조회 요청 모델
    """
    offset: Optional[int] = 0
    limit: Optional[int] = 30
    sns_login_type: Optional[str] = None
    email: Optional[EmailStr] = None
    created_at_start: Optional[str] = None
    created_at_end: Optional[str] = None
    nickname: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    order_by: Optional[str] = None
    order_direction: Optional[str] = None

class UserListResponse(BaseModel):
    """
    사용자 리스트 조회 응답 모델
    """
    total: int
    offset: int
    limit: int
    user_list: list[UserResponse]

class UserDetailResponse(BaseModel):
    """
    사용자 상세 조회 응답 모델
    """
    user: UserResponse
    child_list: list[ChildSchema]


class MealListRequest(BaseModel):
    """
    식단 리스트 조회 요청 모델
    """
    offset: Optional[int] = 0
    limit: Optional[int] = 30
    user_id: Optional[int] = None
    is_active: Optional[str] = None
    input_date: Optional[str] = None
    user_name: Optional[str] = None
    nickname: Optional[str] = None
    meal_stage: Optional[int] = None
    category_code: Optional[str] = None
    created_at_start: Optional[str] = None
    created_at_end: Optional[str] = None
    updated_at_start: Optional[str] = None
    updated_at_end: Optional[str] = None
    deleted_at_start: Optional[str] = None
    deleted_at_end: Optional[str] = None
    order_by: Optional[str] = None
    order_direction: Optional[str] = None

class MealListResponse(BaseModel):
    """
    식단 리스트 조회 요청 모델
    """
    offset: Optional[int] = 0
    limit: Optional[int] = 30
    total: Optional[int] = None
    meal_list: Optional[list[MealItem]] = None

class MealForceUpdate(BaseModel):
    """
    식단 강제 업데이트 요청 모델
    """
    is_active: Optional[str] = None

class CategoryListRequest(BaseModel):
    """
    카테고리 리스트 조회 요청 모델
    """
    offset: Optional[int] = 0
    limit: Optional[int] = 30
    order_by: Optional[str] = None
    order_direction: Optional[str] = None
    type: Optional[str] = None
    code: Optional[str] = None
    is_active: Optional[str] = None

class CategoryListResponse(BaseModel):
    """
    카테고리 리스트 조회 응답 모델
    """
    category_list: list[dict]

class CategoryCreateOrUpdateRequest(BaseModel):
    id: Optional[int] = None
    type: str
    code: Optional[str] = None
    value: Optional[str] = None
    sort: Optional[int] = None
    is_active: Optional[str] = "Y"
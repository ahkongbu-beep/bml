from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from app.schemas.feeds_schemas import FeedsUserResponse
from app.schemas.users_schemas import UserChildItemSchema

class CalendarCopyRequest(BaseModel):
    target_user_hash: str
    target_feed_id: int
    copy_input_date: str
    category_id: int

class FeedListRequest(BaseModel):
    type: str = "list"
    view_type: str = "all"
    limit: int = Field(10, ge=1)
    offset: int = Field(0, ge=0)
    cursor: Optional[int] = None
    title: Optional[str] = None
    nickname: Optional[str] = None
    sort_by: str = "created_at"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    target_user_hash: Optional[str] = None
    # 앞으로 계속 추가하면 됨
    meal_stage: Optional[int] = None
    meal_stage_detail: Optional[str] = None

class MealsCalendarResponse(BaseModel):
    id:int
    contents: str
    tags: List[str] = []
    input_date: str
    month: str
    meal_condition: Optional[str] = None
    is_liked: Optional[bool] = False
    category_id: int
    category_name: Optional[str] = None
    is_public: str
    view_count: int
    like_count: Optional[int] = 0
    is_pre_made: str
    mapped_tags: List[str] = []
    refer_feed_id: int
    meal_stage: Optional[int] = None
    meal_stage_detail: Optional[str] = None
    image_url: Optional[str] = None
    view_hash: str
    user:FeedsUserResponse
    childs: Optional[UserChildItemSchema] = None


class MealsCalendarCreateRequest(BaseModel):
    category_id: int
    input_date: str
    title: str
    contents: str
    tags: Optional[List[str]] = []

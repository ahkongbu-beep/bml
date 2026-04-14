from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.users_schemas import UserChildItemSchema
from app.schemas.ingredient_schemas import IngredientMapperItemSchema

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

class FeedLikeToggleRequest(BaseModel):
    user_hash: str

class FeedDeleteCommentRequest(BaseModel):
    user_hash: str

class FeedCopyRequest(BaseModel):
    category_code: int
    input_date: str
    memo: str
    title: Optional[str] = None
    target_meal_id: int
    target_user_hash: str
    ingredients: Optional[list] = []


class FeedDeleteRequest(BaseModel):
    user_hash: str

class FeedCreateCommentRequest(BaseModel):
    meal_id: int
    comment: str
    parent_hash: Optional[str] = None

class FeedsUserResponse(BaseModel):
    id: Optional[int] = None
    nickname: Optional[str] = None
    profile_image: Optional[str] = None
    user_hash: Optional[str] = None

class FeedsCommentResponse(BaseModel):
    meal_id: int
    parent_id: Optional[int] = None
    comment: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    is_owner: Optional[bool] = False
    view_hash:str
    parent_hash:str
    user: Optional[FeedsUserResponse] = None
    children: List['FeedsCommentResponse'] = []


# Forward reference를 위한 model rebuild
FeedsCommentResponse.model_rebuild()

class FeedsResponse(BaseModel):
    id: int
    user_id: int
    title: str
    content: Optional[str] = None
    is_published: Optional[str] = None
    meal_condition: Optional[str] = "2"
    view_count: int
    like_count: int
    created_at: datetime
    updated_at: datetime
    meal_stage: Optional[int] = 0
    meal_stage_detail: Optional[str] = ""
    category_id: Optional[int] = 0
    category_name: Optional[str] = None
    is_liked: Optional[bool] = False
    tags: List[IngredientMapperItemSchema] = []
    images: List[str] = []
    user_hash: Optional[str] = None
    user: Optional[FeedsUserResponse] = None
    childs: Optional[UserChildItemSchema] = None
    comments: List[FeedsCommentResponse] = []
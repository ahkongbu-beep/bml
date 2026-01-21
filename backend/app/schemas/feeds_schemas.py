from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.users_schemas import UserChildItemSchema

class FeedLikeToggleRequest(BaseModel):
    user_hash: str

class FeedDeleteCommentRequest(BaseModel):
    user_hash: str

class FeedCopyRequest(BaseModel):
    category_code: int
    input_date: str
    memo: str
    title: str
    target_feed_id: int
    target_user_hash: str

class FeedLikeResponseData(BaseModel):
    feed_id: int
    like_count: int
    is_liked: bool

class FeedDeleteRequest(BaseModel):
    user_hash: str

class FeedCreateCommentRequest(BaseModel):
    feed_id: int
    comment: str
    parent_hash: Optional[str] = None

class FeedsUserResponse(BaseModel):
    id: Optional[int] = None
    nickname: Optional[str] = None
    profile_image: Optional[str] = None
    user_hash: Optional[str] = None

class FeedsCommentResponse(BaseModel):
    feed_id: int
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
    is_published: str
    view_count: int
    like_count: int
    created_at: datetime
    updated_at: datetime
    is_liked: Optional[bool] = False
    tags: List[str] = []
    images: List[str] = []
    user_hash: Optional[str] = None
    user: Optional[FeedsUserResponse] = None
    childs: Optional[UserChildItemSchema] = None
    comments: List[FeedsCommentResponse] = []
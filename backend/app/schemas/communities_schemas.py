from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.users_schemas import UserChildItemSchema
from app.schemas.feeds_schemas import FeedsCommentResponse, FeedsUserResponse

class CommunityCreateRequest(BaseModel):
    title: str
    contents: str
    category_code: int
    is_secret: str = "N"  # Y/N

class CommunityUpdateRequest(BaseModel):
    title: str
    contents: str
    is_secret: str = "N"  # Y/N

class CommunityCreateCommentRequest(BaseModel):
    comment: str
    parent_hash: Optional[str] = None


class CommunityCommentResponse(BaseModel):
    community_id: int
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

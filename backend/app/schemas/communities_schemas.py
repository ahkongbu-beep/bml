from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.feeds_schemas import FeedsCommentResponse, FeedsUserResponse

class CommunityListReqest(BaseModel):
    category_code: Optional[int] = None
    is_notice: Optional[str] = None
    is_secret: Optional[str] = None
    keyword: Optional[str] = None
    user_nickname: Optional[str] = None
    month: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    sort_by: Optional[str] = "latest"
    cursor: Optional[int] = None
    my_only: Optional[str] = None
    limit: int = 20

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

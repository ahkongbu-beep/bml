from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

class FeedLikeToggleRequest(BaseModel):
    user_hash: str

class FeedsUserResponse(BaseModel):
    nickname: Optional[str] = None
    profile_image: Optional[str] = None

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
    tags: List[str] = []
    images: List[str] = []
    user_hash: Optional[str] = None
    user: Optional[FeedsUserResponse] = None
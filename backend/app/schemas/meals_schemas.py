from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from app.schemas.feeds_schemas import FeedsUserResponse

class CalendarCopyRequest(BaseModel):
    target_user_hash: str
    target_feed_id: int
    copy_input_date: str
    category_id: int

class MealsCalendarResponse(BaseModel):
    title: str
    contents: str
    tags: List[str] = []
    input_date: str
    month: str
    category_id: int
    category_name: str
    refer_feed_id: int
    image_url: Optional[str] = None
    view_hash: str
    user:FeedsUserResponse

class MealsCalendarCreateRequest(BaseModel):
    category_id: int
    input_date: str
    title: str
    contents: str
    tags: Optional[List[str]] = []

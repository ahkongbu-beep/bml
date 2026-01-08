from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from app.schemas.feeds_schemas import FeedsUserResponse

class MealsCalendarResponse(BaseModel):
    title: str
    contents: str
    tags: List[str] = []
    input_date: str
    month: str
    category_id: int
    category_name: str
    view_hash: str
    user:FeedsUserResponse

class MealsCalendarCreateRequest(BaseModel):
    user_hash: str
    category_id: int
    input_date: str
    title: str
    contents: str
    tags: Optional[List[str]] = []
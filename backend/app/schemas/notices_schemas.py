from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class NoticesCreateRequest(BaseModel):
    title: str
    category_id: int
    content: str
    status: str  # active / inactive
    is_important: str # Y / N

class NoticesUpdateRequest(BaseModel):
    title: str
    category_id: int
    content: str
    is_important: str # Y / N

class NoticesResponse(BaseModel):
    title: str
    content: Optional[str] = None
    status: str
    admin_name: str
    created_at: datetime
    updated_at: datetime
    ip: str
    is_important: str
    category_text: str
    view_hash: str
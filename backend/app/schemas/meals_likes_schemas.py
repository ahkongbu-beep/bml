from pydantic import BaseModel, Field
from typing import Optional

class LikeToggleRequest(BaseModel):
    meal_hash: str = Field(..., description="식단 hash")

class LikeToggleResponse(BaseModel):
    meal_id: int
    like_count: int
    is_liked: bool

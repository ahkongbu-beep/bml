from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class CategoryCodeResponse(BaseModel):
    id: int
    type: str
    code: str
    value: str
    sort: int
    is_active: str  # Y / N

class FoodItemSaveRequest(BaseModel):
    food_type: Optional[str] = "FOOD"
    food_name: str
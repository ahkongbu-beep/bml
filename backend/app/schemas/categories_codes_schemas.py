from pydantic import BaseModel
from typing import Optional

class CategoryCodeItem(BaseModel):
    id: int
    type: str
    code: str
    value: str
    sort: int
    is_active: str  # Y / N

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
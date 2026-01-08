from pydantic import BaseModel

class MealsMappersResponse(BaseModel):
    user_id: int
    category_id: int
    category_name: str
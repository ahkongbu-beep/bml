from pydantic import BaseModel
from typing import List, Optional

from app.schemas.feeds_schemas import FeedsUserResponse

class IngredientScoreRequest(BaseModel):
    ingredient_id: int
    score: float

class TempMealSummaryRequest(BaseModel):
    category_code: int
    input_date: str
    contents: str
    child_id: Optional[int] = None
    meal_stage: Optional[int] = None
    meal_stage_detail: Optional[str] = None
    ingredients: List[IngredientScoreRequest] = []

class TempMealSummaryResponse(BaseModel):
    ai_hash: str
    total_score: int
    total_summary: Optional[str] = None
    analysis_json: Optional[str] = None
    suggestion: Optional[str] = None

class SummaryFeedRequest(BaseModel):
    feed_id: int
    image_id: int
    prompt: str

class SummaryFeedResponse(BaseModel):
    model_config = {
        "protected_namespaces": ()
    }

    model: str
    model_id: int
    summary_id: int
    question: str
    answer: str
    created_at: str
    view_hash: str
    user: Optional[FeedsUserResponse] = None



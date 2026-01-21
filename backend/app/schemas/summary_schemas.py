from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

from app.schemas.feeds_schemas import FeedsUserResponse

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



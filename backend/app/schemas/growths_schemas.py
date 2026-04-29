from pydantic import BaseModel, Field
from typing import Optional

class GrowthsListRequest(BaseModel):
    gender: Optional[str] = Field(None, description="성별 (M/W)")
    months: Optional[int] = Field(None, description="개월수")

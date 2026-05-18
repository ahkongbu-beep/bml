from decimal import Decimal
from pydantic import BaseModel, Field
from typing import Optional, Union

class GrowthsListRequest(BaseModel):
    gender: Optional[str] = Field(None, description="성별 (M/W)")
    months: Optional[int] = Field(None, description="개월수")

class GrowthReportItemSchema(BaseModel):
    type: str
    months: Decimal
    value: Decimal
    percent: Union[str, Decimal, float, int]

class GrowthReportSaveRequest(BaseModel):
    reports: list[GrowthReportItemSchema]

from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class ChildSchema(BaseModel):
    child_id: Optional[int] = None
    child_name: str
    child_birth: date
    child_gender: str
    is_agent: str
    allergies: Optional[List[str]] = None


class UserChildCreateRequest(BaseModel):
    children: List[ChildSchema]
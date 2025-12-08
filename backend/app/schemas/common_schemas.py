from pydantic import BaseModel
from typing import Optional, Union, List, Dict, Any

class CommonResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
    data: Optional[Union[Dict[str, Any], List[Any], Any]] = None
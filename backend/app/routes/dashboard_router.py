from fastapi import APIRouter, Depends, Request, Query, UploadFile, UploadFile, File, Form
from app.services import dashboards_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse

router = APIRouter()

""" 피드 해쉬태그 검색 """
@router.get("/init/stat")
def init_stat(db: Session = Depends(get_db)):
    return dashboards_service.init_stat(db)
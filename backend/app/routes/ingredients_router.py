from fastapi import APIRouter, Depends, Request, Query, File, UploadFile, Form
from requests import Session
from app.services import ingredients_service
from app.core.database import get_db
from app.schemas.ingredient_schemas import IngredientRequestSchema
router = APIRouter()

"""
새로운 재료 추가
"""
@router.post("/request")
def ingredient_request(
    body: IngredientRequestSchema,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    특정 사용자의 피드 기반 식단 캘린더 조회
    """
    user_hash = getattr(request.state, "user_hash", None)
    return ingredients_service.ingredient_request(db, user_hash, body)
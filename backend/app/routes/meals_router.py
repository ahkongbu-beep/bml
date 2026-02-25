from fastapi import APIRouter, Depends, Request, Query, File, UploadFile, Form
from typing import Optional
import json
from app.services import meals_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse
from app.schemas.meals_schemas import MealsCalendarCreateRequest, CalendarCopyRequest
router = APIRouter()

@router.get("/calendar")
def list_calendar(request: Request, month: str = Query(...), db: Session = Depends(get_db)):

    params = {
        "month": month if month else "",
        "user_hash": getattr(request.state, "user_hash", None)
    }

    return meals_service.list_calendar(db, params)

@router.post("/create")
async def create_meal(
    request: Request,
    user_hash: Optional[str] = Form(None),
    category_id: int = Form(...),
    input_date: str = Form(...),
    contents: str = Form(...),
    isPreMade: str = Form("N"),
    ingredients: str = Form("[]"),
    is_public: str = Form("N"),
    meal_condition: int = Form(0),
    attaches: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # user_hash는 Form에서 오거나 request.state에서 가져오기
    if not user_hash:
        user_hash = getattr(request.state, "user_hash", None)

    # ingredients는 JSON string으로 전달되므로 파싱
    try:
        ingredients_list = json.loads(ingredients) if ingredients else []
    except:
        ingredients_list = []

    body = {
        'user_hash': user_hash,
        'category_id': category_id,
        'input_date': input_date,
        'contents': contents,
        'ingredients': ingredients_list,
        'is_pre_made': isPreMade,
        'is_public': is_public,
        'meal_condition': meal_condition,
        'attaches': attaches
    }

    return await meals_service.create_meal(db, body)

@router.get("/calendar/month_image")
async def get_calendar_month_image(request: Request, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, message="사용자 인증이 필요합니다.", data=None)

    params = {
        "user_hash": user_hash,
    }

    return await meals_service.get_calendar_month_image(db, params)

@router.post("/calendar/image/create")
async def upload_calendar_month_image(
    request: Request,
    month: str = Form(...),
    attaches: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, message="사용자 인증이 필요합니다.", data=None)

    return await meals_service.upload_calendar_month_image(db, user_hash, month, attaches)

@router.put("/update/{meal_hash}")
async def update_meal(
    request: Request,
    meal_hash: str,
    user_hash: Optional[str] = Form(None),
    category_id: Optional[int] = Form(None),
    input_date: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    meal_condition: Optional[int] = Form(None),
    contents: Optional[str] = Form(None),
    ingredients: Optional[str] = Form(None),
    isPreMade: Optional[str] = Form(None),
    is_public: Optional[str] = Form(None),
    attaches: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # user_hash는 Form에서 오거나 request.state에서 가져오기
    if not user_hash:
        user_hash = getattr(request.state, "user_hash", None)

    # ingredients는 JSON string으로 전달되므로 파싱
    ingredients_list = None
    if ingredients:
        try:
            ingredients_list = json.loads(ingredients)
        except:
            ingredients_list = []

    body = {
        'meal_hash': meal_hash,
        'user_hash': user_hash,
        'attaches': attaches
    }

    # None이 아닌 값만 추가
    if category_id is not None:
        body['category_id'] = category_id
    if input_date is not None:
        body['input_date'] = input_date
    if title is not None:
        body['title'] = title
    if contents is not None:
        body['contents'] = contents
    if ingredients_list is not None:
        body['ingredients'] = ingredients_list
    if isPreMade is not None:
        body['is_pre_made'] = isPreMade
    if is_public is not None:
        body['is_public'] = is_public
    if meal_condition is not None:
        body['meal_condition'] = meal_condition

    return await meals_service.update_meal(db, body)

@router.delete("/delete/{meal_hash}")
async def delete_meal(request: Request, meal_hash: str, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)
    params = {
        "meal_hash": meal_hash,
        "user_hash": user_hash
    }
    return await meals_service.delete_meal(db, params)

@router.get("/check/daily")
def check_daily_meal(request: Request, date: str = Query(...), db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, message="사용자 인증이 필요합니다.", data=None)

    params = {
        "user_hash": user_hash,
        "date": date
    }
    return meals_service.check_daily_meal(db, params)

""" 다른 사용자의 식단 캘린더를 나의 캘린더에 복사 """
@router.post("/calendar/copy")
async def copy_meal_calendar(request: Request, body: CalendarCopyRequest, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)

    if not user_hash:
        return CommonResponse(success=False, message="사용자 인증이 필요합니다.", data=None)

    params = body.dict()

    return await meals_service.copy_meal_calendar(db, user_hash, params)
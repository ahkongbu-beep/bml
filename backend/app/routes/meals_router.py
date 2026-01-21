from fastapi import APIRouter, Depends, Request, Query
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
async def create_meal(request: Request, body_request: MealsCalendarCreateRequest, db: Session = Depends(get_db)):
    body = await request.json()
    body['user_hash'] = getattr(request.state, "user_hash", None)

    return await meals_service.create_meal(db, body)

@router.put("/update/{meal_hash}")
async def update_meal(request: Request, meal_hash: str, body_request: MealsCalendarCreateRequest, db: Session = Depends(get_db)):
    user_hash = getattr(request.state, "user_hash", None)
    body = body_request.dict()
    body['meal_hash'] = meal_hash
    body['user_hash'] = user_hash
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
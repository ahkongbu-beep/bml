from fastapi import APIRouter, Depends, Request, Query
from app.services import meals_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.common_schemas import CommonResponse
from app.schemas.meals_schemas import MealsCalendarCreateRequest
router = APIRouter()

@router.get("/calendar")
def list_calendar(month: str = Query(...), user_hash: str = Query(...), db: Session = Depends(get_db)):

    params = {
        "month": month if month else "",
        "user_hash": user_hash
    }

    return meals_service.list_calendar(db, params)

@router.post("/create")
async def create_meal(request: MealsCalendarCreateRequest, db: Session = Depends(get_db)):
    body = request.dict()

    return await meals_service.create_meal(db, body)

@router.delete("/delete/{meal_hash}")
def delete_meal(meal_hash: str, db: Session = Depends(get_db)):
    params = {
        "meal_hash": meal_hash
    }
    return meals_service.delete_meal(db, params)

@router.get("/check/daily")
def check_daily_meal(user_hash: str = Query(...), date: str = Query(...), db: Session = Depends(get_db)):
    params = {
        "user_hash": user_hash,
        "date": date
    }
    return meals_service.check_daily_meal(db, params)
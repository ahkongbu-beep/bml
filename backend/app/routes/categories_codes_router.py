from fastapi import APIRouter, Depends, Request, Query
from app.services import categories_codes_service
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.schemas.categories_codes_schemas import FoodItemSaveRequest
router = APIRouter()

@router.get("/list")
def list_categories_codes(cc_type: str = Query(None), db: Session = Depends(get_db)):
    return categories_codes_service.list_categories_codes(db, cc_type)

@router.post("/create")
async def save_categories_code(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    return categories_codes_service.save_categories_code(db, data)

@router.put("/update")
async def update_categories_code(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    if (not data.get("id")):
        return {"success": False, "message": "수정을 위한 필수 정보가 없습니다.", "data": None}

    return categories_codes_service.save_categories_code(db, data)

@router.delete("/delete")
async def delete_categories_code(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    category_id = data.get("category_id")

    if not category_id:
        return {"success": False, "message": "삭제할 카테고리 ID가 필요합니다.", "data": None}

    return categories_codes_service.delete_categories_code(db, category_id)

""" 음식 추가 API """
@router.post("/food/add")
async def add_food_item(request: Request, body: FoodItemSaveRequest, db: Session = Depends(get_db)):
    data = body.dict()
    return categories_codes_service.add_food_item(db, data)

""" 음식 수정 API """
@router.put("/food/modify/{food_id}")
async def modify_food_item(food_id: int, request: Request,  body: FoodItemSaveRequest, db: Session = Depends(get_db)):
    data = body.dict()
    return categories_codes_service.modify_food_item(db, food_id, data)

""" 음식 리스트 조회 API """
@router.get("/food/list")
def list_food_items(food_type: str, food_name: str = Query(None), db: Session = Depends(get_db)):
    return categories_codes_service.list_food_items(db, food_type, food_name)


""" 음식 검색 API (이름으로) """
@router.get("/food/search")
def search_food_items(food_name: str, db: Session = Depends(get_db)):
    return categories_codes_service.search_food_items(db, food_name)
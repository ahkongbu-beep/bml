from app.core.database import get_db

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.schemas.admin_schmas import AllergySaveRequest, NoticeListRequest, NoticesCreateRequest, NoticesUpdateRequest, UserListRequest, MealListRequest, MealForceUpdate, CategoryListRequest, CategoryCreateOrUpdateRequest, IngredientNutritionRequest, OrgIngredientCreateRequest
from app.schemas.common_schemas import CommonResponse

from app.services import admins_service
router = APIRouter()

# ====================================================================================
# 대시보드 초기 통계 정보 조회 엔드포인트
# ====================================================================================
@router.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db)):
    return admins_service.init_stat(db)

# ====================================================================================
# 공지사항 엔드포인트
# ====================================================================================
@router.get("/notices")
def list_notices(request: Request, db: Session = Depends(get_db), params: NoticeListRequest = Depends()):
    """
    공지사항 리스트 조회 API 엔드포인트
    """
    return admins_service.notices(db, params)

@router.post("/notices")
def create_notice(request: Request, notice: NoticesCreateRequest, db: Session = Depends(get_db)):
    """
    공지사항 작성 API 엔드포인트
    """
    client_ip = request.client.host

    if notice.is_important not in ["Y", "N"]:
        return CommonResponse(success=False, error="is_important 필드는 'Y' 또는 'N'이어야 합니다.", data=None)

    if notice.status not in ["active", "inactive"]:
        return CommonResponse(success=False, error="status 필드는 'active' 또는 'inactive'이어야 합니다.", data=None)

    return admins_service.create_notice(db, notice, client_ip)

@router.put("/notices/{view_hash}")
def update_notice(request: Request, view_hash: str, params: NoticesUpdateRequest, db: Session = Depends(get_db)):
    """
    공지사항 수정 API 엔드포인트
    """
    client_ip = request.client.host

    if params.is_important not in ["Y", "N"]:
        return CommonResponse(success=False, error="is_important 필드는 'Y' 또는 'N'이어야 합니다.", data=None)

    if params.status not in ["active", "inactive"]:
        return CommonResponse(success=False, error="status 필드는 'active' 또는 'inactive'이어야 합니다.", data=None)

    return admins_service.update_notice(db, view_hash, params, client_ip)

@router.delete("/notices/{view_hash}")
def delete_notice(request: Request, view_hash: str, db: Session = Depends(get_db)):
    """
    공지사항 삭제 API 엔드포인트
    """
    client_ip = request.client.host
    return admins_service.delete_notice(db, client_ip, view_hash)

# ====================================================================================
# 카테고리 정보 엔드포인트
# ====================================================================================
@router.get("/categories")
def list_categories(request: Request, params: CategoryListRequest = Depends(), db: Session = Depends(get_db)):
    """
    카테고리 리스트 조회 API 엔드포인트
    """
    return admins_service.category_list(db, params)

@router.post("/categories/upsert")
def create_category(request: Request, params: CategoryCreateOrUpdateRequest, db: Session = Depends(get_db)):
    """
    카테고리 생성 API 엔드포인트
    """
    return admins_service.category_upsert(db, params)

# ====================================================================================
# 사용자정보 엔드포인트
# ====================================================================================
@router.get("/users")
def list_users(request: Request, body: UserListRequest = Depends(), db: Session = Depends(get_db)):
    """
    사용자 리스트 조회 API 엔드포인트
    """
    return admins_service.user_list(db, body)

@router.get("/users/{user_hash}")
def get_user_detail(request: Request, user_hash: str, db: Session = Depends(get_db)):
    """
    사용자 상세 조회 API 엔드포인트
    """
    return admins_service.user_detail(db, user_hash)

# ====================================================================================
# 식단정보 엔드포인트
# ====================================================================================
@router.get("/meals")
def list_meals(request: Request, body: MealListRequest = Depends(), db: Session = Depends(get_db)):
    """
    식단 리스트 조회 API 엔드포인트
    """
    return admins_service.meal_list(db, body)

@router.get("/meals/{meal_hash}")
def get_meal_detail(request: Request, meal_hash: str, db: Session = Depends(get_db)):
    """
    식단 상세 조회 API 엔드포인트
    """
    return admins_service.meal_detail(db, meal_hash)

@router.post("/meals/{meal_hash}/force-update")
def force_update_meal(request: Request, meal_hash: str, params: MealForceUpdate, db: Session = Depends(get_db)):
    """
    식단 강제 업데이트 API 엔드포인트
    """
    return admins_service.force_update_meal(db, meal_hash, params)

# ====================================================================================
# 알레르기 관리 엔드포인트
# ====================================================================================
@router.get("/allergies")
def list_allergies(request: Request, db: Session = Depends(get_db)):
    """
    알레르기 리스트 조회 API 엔드포인트
    """
    return admins_service.allergy_list(db)

@router.post("/allergies")
def create_allergy(request: Request, params: AllergySaveRequest, db: Session = Depends(get_db)):
    """
    알레르기 생성 API 엔드포인트
    """
    return admins_service.create_allergy(db, params)

@router.put("/allergies/{food_code}")
def update_allergy(request: Request, food_code: str, params: AllergySaveRequest, db: Session = Depends(get_db)):
    """
    알레르기 수정 API 엔드포인트
    """

    params.food_code = food_code
    return admins_service.update_allergy(db, params)

# ====================================================================================
# 재료요청 관리 엔드포인트
# ====================================================================================
@router.get("/org_ingredients")
def list_org_ingredients(request: Request, db: Session = Depends(get_db)):
    """
    원재료 리스트 조회 API 엔드포인트
    """
    return admins_service.org_ingredient_list(db)

@router.post("/org_ingredients")
def create_org_ingredient(request: Request, body: OrgIngredientCreateRequest, db: Session = Depends(get_db)):
    """
    원재료 등록 API 엔드포인트
    """
    return admins_service.create_org_ingredient(db, body)

@router.put("/org_ingredients/{ingredient_id}")
def update_org_ingredient(request: Request, ingredient_id: int, body: IngredientNutritionRequest, db: Session = Depends(get_db)):
    """
    원재료 수정 API 엔드포인트
    """
    return admins_service.update_org_ingredient(db, ingredient_id, body)

@router.post("/ingredients/request")
def request_ingredient(request: Request, body: IngredientNutritionRequest, db: Session = Depends(get_db)):
    """
    사용자 재료 요청 API 엔드포인트
    """
    return admins_service.ingredient_request(db, body)

@router.get("/ingredients")
def list_ingredients(request: Request, db: Session = Depends(get_db)):
    """
    사용자 재료 요청 리스트 조회 API 엔드포인트
    """
    return admins_service.ingredient_list(db)

@router.post("/ingredients/{request_id}/approve")
def approve_ingredient_request(request: Request, request_id: int, body: IngredientNutritionRequest, db: Session = Depends(get_db)):
    """
    사용자 재료 요청 승인 API 엔드포인트
    """
    return admins_service.approve_ingredient_request(db, request_id, body)

@router.put("/ingredients/{request_id}/status")
def reject_ingredient_request(request: Request, request_id: int, db: Session = Depends(get_db)):
    """
    사용자 재료 요청 거절 API 엔드포인트
    """
    return admins_service.reject_ingredient_request(db, request_id)


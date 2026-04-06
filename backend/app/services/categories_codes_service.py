from app.repository.categories_codes_repository import CategoriesCodesRepository
from app.repository.food_item_repository import FoodItemRepository
from app.schemas.common_schemas import CommonResponse

def get_category_code_by_id(db, category_id: int):
    return CategoriesCodesRepository.get_category_codes_by_id(db, category_id)

def get_category_code_by_type_and_code(db, type: str, code: str):
    return CategoriesCodesRepository.get_category_code_by_type_and_code(db, type, code)

def get_category_list(db, params):
    from app.serializer.categories_codes_serialize import serialize_category_code
    result = CategoriesCodesRepository.get_category_list(db, params)
    return [serialize_category_code(cc) for cc in result]

def get_category_by_type_and_sort(db, type: str, sort: int):
    return CategoriesCodesRepository.get_category_by_type_and_sort(db, type, sort)

def list_categories_codes(db, cc_type: str = None):

    params = {}
    if cc_type:
        params["type"] = cc_type

    categories_codes = get_category_list(db, params)

    # type별로 그룹화
    grouped_data = {}
    for cc in categories_codes:
        type_key = cc.type.lower()
        if type_key not in grouped_data:
            grouped_data[type_key] = []
        grouped_data[type_key].append(cc.model_dump())

    return CommonResponse(success=True, message="", data=grouped_data)

def insert_category_process(db, params):
    try:
        new_category_code = CategoriesCodesRepository.create(db, params)
        return new_category_code
    except Exception as e:
        db.rollback()
        return False

def update_category_process(db, category: int, params):
    try:
        return CategoriesCodesRepository.update(db, category, params)
    except Exception as e:
        db.rollback()
        return False

def delete_categories_code(db, category_id: int):
    category_code = CategoriesCodesRepository.get_category_codes_by_id(db, category_id)
    if not category_code:
        return CommonResponse(success=False, error="카테고리 정보가 조회되지않습니다.", data=None)

    try:
        CategoriesCodesRepository.update(db, category_code, {"is_active": "N"})

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"{str(e)}", data=None)

    return CommonResponse(success=True, message="카테고리 정보가 성공적으로 삭제되었습니다.", data=None)

""" 음식 리스트 조회 서비스 함수 """
def list_food_items(db, food_type: str, food_name: str = None):

    result_data = FoodItemRepository.get_list(db, food_type, food_name).to_list()
    return CommonResponse(success=True, message="", data=result_data)

""" 음식 검색 서비스 함수 (이름으로) """
def search_food_items(db, food_name: str):

    food_items = FoodItemRepository.search_by_name(db, food_name).to_list()

    result_data = []
    for item in food_items:
        result_data.append({
            "id": item.id,
            "food_code": item.food_code,
            "food_type": item.food_type,
            "food_name": item.food_name,
        })

    return CommonResponse(success=True, message="", data=result_data)

""" 음식 추가 서비스 함수 """
def add_food_item(db, data):

    # 동일한 item 이 있는지 확인
    exist_food_item = FoodItemRepository.get_by_type_and_code(db, data.get("food_type", "food"), data["food_code"])
    if exist_food_item:
        return CommonResponse(success=False, error="동일한 이름의 음식 아이템이 이미 존재합니다.", data=None)

    try:
        params = {
            "food_type": data.get("food_type", "food"),
            "food_name": data["food_name"],
        }
        new_food_item = FoodItemRepository.create(db, params)

        if not new_food_item:
            raise Exception("음식 아이템 생성에 실패했습니다.")

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"{str(e)}", data=None)

    result_data = {
        "id": new_food_item.id,
        "food_code": new_food_item.food_code,
        "food_type": new_food_item.food_type,
        "food_name": new_food_item.food_name,
    }

    return CommonResponse(success=True, message="음식 아이템이 성공적으로 추가되었습니다.", data=result_data)

""" 음식 수정 서비스 함수 """
def modify_food_item(db, food_id: int, data):
    food_item = FoodItemRepository.get_one_data(db, food_id)
    if not food_item:
        return CommonResponse(success=False, error="음식 아이템 정보가 조회되지않습니다.", data=None)

    try:
        updated_food_item = FoodItemRepository.update(db, food_item.id, data)

        # SQLAlchemy 객체를 딕셔너리로 변환
        response_data = {
            "id": updated_food_item.id,
            "food_code": updated_food_item.food_code,
            "food_type": updated_food_item.food_type,
            "food_name": updated_food_item.food_name,
        }

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"{str(e)}", data=None)

    return CommonResponse(success=True, message="음식 아이템 정보가 성공적으로 업데이트되었습니다.", data=response_data)
from app.models.categories_codes import CategoriesCodes
from app.models.foods_items import FoodItem
from app.schemas.categories_codes_schemas import CategoryCodeResponse
from app.schemas.common_schemas import CommonResponse

def list_categories_codes(db, cc_type: str = None):

    params = {}
    if cc_type:
        params["type"] = cc_type

    categories_codes = CategoriesCodes.get_list(db, params).serialize()

    # type별로 그룹화
    grouped_data = {}
    for cc in categories_codes:
        type_key = cc.type.lower()
        if type_key not in grouped_data:
            grouped_data[type_key] = []
        grouped_data[type_key].append(cc.model_dump())

    return CommonResponse(success=True, message="", data=grouped_data)

def save_categories_code(db, data):

    if data.get("id"):
        # 기존 코드 업데이트
        category_code = db.query(CategoriesCodes).filter(CategoriesCodes.id == data["id"]).first()
        if not category_code:
            return CommonResponse(success=False, error="카테고리 정보가 조회되지않습니다.", data=None)

        try:
            exist_category_code = CategoriesCodes.findByTypeAndSort(db, data["type"], data["sort"])
            if category_code.id != exist_category_code.id and exist_category_code:
                raise Exception("동일한 타입과 정렬순서의 카테고리 코드가 이미 존재합니다.")

            updated_category_code = CategoriesCodes.update(db, category_code.id, data)

            # SQLAlchemy 객체를 딕셔너리로 변환
            response_data = CategoryCodeResponse(
                id=updated_category_code.id,
                type=updated_category_code.type,
                code=updated_category_code.code,
                value=updated_category_code.value,
                sort=updated_category_code.sort,
                is_active=updated_category_code.is_active
            )

        except Exception as e:
            db.rollback()
            return CommonResponse(success=False, error=f"{str(e)}", data=None)

        return CommonResponse(success=True, message="카테고리 정보가 성공적으로 업데이트되었습니다.", data=response_data)

    else:
        # 신규 코드 생성
        try:
            params = {
                "type": data["type"],
                "value": data["value"],
                "sort": data.get("sort", 1),
            }

            exist_category_code = CategoriesCodes.findByTypeAndSort(db, params["type"], params["sort"])
            if exist_category_code:
                raise Exception("동일한 타입과 정렬순서의 카테고리 코드가 이미 존재합니다.")

            exist_category_code = CategoriesCodes.findByTypeAndValue(db, params["type"], params["value"])
            if exist_category_code:
                raise Exception("동일한 타입과 값의 카테고리 코드가 이미 존재합니다.")

            new_category_code = CategoriesCodes.create(db, params)

            # SQLAlchemy 객체를 딕셔너리로 변환
            response_data = CategoryCodeResponse(
                id=new_category_code.id,
                type=new_category_code.type,
                code=new_category_code.code,
                value=new_category_code.value,
                sort=new_category_code.sort,
                is_active=new_category_code.is_active
            )

        except Exception as e:
            db.rollback()
            return CommonResponse(success=False, error=f"{str(e)}", data=None)

        return CommonResponse(success=True, message="카테고리 정보가 성공적으로 생성되었습니다.", data=response_data)

def delete_categories_code(db, category_id: int):
    category_code = db.query(CategoriesCodes).filter(CategoriesCodes.id == category_id).first()
    if not category_code:
        return CommonResponse(success=False, error="카테고리 정보가 조회되지않습니다.", data=None)

    try:
        CategoriesCodes.update(db, category_code.id, {"is_active": "N"})

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=f"{str(e)}", data=None)

    return CommonResponse(success=True, message="카테고리 정보가 성공적으로 삭제되었습니다.", data=None)

""" 음식 리스트 조회 서비스 함수 """
def list_food_items(db, food_type: str, food_name: str = None):

    result_data = FoodItem.get_list(db, food_type, food_name).to_list()
    return CommonResponse(success=True, message="", data=result_data)

""" 음식 검색 서비스 함수 (이름으로) """
def search_food_items(db, food_name: str):

    food_items = FoodItem.search_by_name(db, food_name).to_list()

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
    exist_food_item = db.query(FoodItem).filter(
        FoodItem.food_type == data.get("food_type", "food"),
        FoodItem.food_name == data["food_name"]
    ).first()

    if exist_food_item:
        return CommonResponse(success=False, error="동일한 이름의 음식 아이템이 이미 존재합니다.", data=None)

    try:
        params = {
            "food_type": data.get("food_type", "food"),
            "food_name": data["food_name"],
        }
        new_food_item = FoodItem.create(db, params)

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

    food_item = db.query(FoodItem).filter(FoodItem.id == food_id).first()
    if not food_item:
        return CommonResponse(success=False, error="음식 아이템 정보가 조회되지않습니다.", data=None)

    try:
        updated_food_item = FoodItem.update(db, food_item.id, data)

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
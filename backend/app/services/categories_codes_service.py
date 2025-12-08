from app.models.categories_codes import CategoriesCodes
from app.schemas.categories_codes_schemas import CategoryCodeResponse
from app.schemas.common_schemas import CommonResponse

def list_categories_codes(db, cc_type: str = None):

    params = {}
    if cc_type:
        params["type"] = cc_type

    categories_codes = CategoriesCodes.getList(db, params).getData()

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
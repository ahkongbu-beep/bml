from app.core.database import Base
from app.libs.serializers.query import SerializerQueryResult
from app.models.categories_codes import CategoriesCodes

class CategoriesCodesRepository:
    @staticmethod
    def get_category_codes_by_id(session, category_id: int):
        return session.query(CategoriesCodes).filter(CategoriesCodes.id == category_id).first()

    @staticmethod
    def get_one_data(session, category_id: int):
        return session.query(CategoriesCodes).filter(CategoriesCodes.id == category_id).first()

    @staticmethod
    def findByTypeAndSort(session, type: str, sort: int):
        return session.query(CategoriesCodes).filter(
            CategoriesCodes.type == type,
            CategoriesCodes.sort == sort
        ).first()

    @staticmethod
    def findByTypeAndCode(session, type: str, code: str):
        return session.query(CategoriesCodes).filter(
            CategoriesCodes.type == type,
            CategoriesCodes.code == code
        ).first()

    def findByTypeAndValue(session, type: str, value: str):
        return session.query(CategoriesCodes).filter(
            CategoriesCodes.type == type,
            CategoriesCodes.value == value
        ).first()

    @staticmethod
    def getLastCode(session, type: str):
        last_count = session.query(CategoriesCodes).filter(
            CategoriesCodes.type == type
        ).count()

        last_count += 1
        type_word = type.split('_')[0].lower()
        code = type_word + f"_{str(last_count).zfill(3)}"
        return code

    @staticmethod
    def create(session, params: dict):
        new_code = CategoriesCodes.getLastCode(session, params["type"])

        params["code"] = new_code

        try:
            new_category_code = CategoriesCodes(
                type=params["type"],
                code=params["code"],
                value=params["value"],
                sort=params.get("sort", 1),
                is_active=params.get("is_active", "Y")
            )
            session.add(new_category_code)
            session.commit()
            session.refresh(new_category_code)
        except Exception as e:
            session.rollback()
            raise e

        return new_category_code

    @staticmethod
    def update(session, category_id: int, params: dict):
        category_code = CategoriesCodes.findById(session, category_id)
        if not category_code:
            raise Exception("카테고리 코드가 존재하지 않습니다.")

        try:
            category_code.type = params.get("type", category_code.type)
            category_code.code = params.get("code", category_code.code)
            category_code.value = params.get("value", category_code.value)
            category_code.sort = params.get("sort", category_code.sort)
            category_code.is_active = params.get("is_active", category_code.is_active)

            session.commit()
            session.refresh(category_code)
        except Exception as e:
            session.rollback()
            raise e

        return category_code

    @staticmethod
    def get_list(session, params: dict):
        # TODO: Admin 및 Category 테이블이 생성되면 JOIN 추가
        # 현재는 임시 데이터 사용

        query = session.query(CategoriesCodes)

        if 'type' in params and params['type']:
            query = query.filter(CategoriesCodes.type == params['type'])

        if "code" in params and params["code"]:
            query = query.filter(CategoriesCodes.code == params["code"])

        if "is_active" in params and params["is_active"]:
            query = query.filter(CategoriesCodes.is_active == params["is_active"])

        if "value" in params and params["value"]:
            query = query.filter(CategoriesCodes.value == params["value"])

        results = query.order_by(
            CategoriesCodes.type.asc(),
            CategoriesCodes.sort.asc()
        ).all()

        return SerializerQueryResult(results)

from app.core.database import Base
from app.models.categories_codes import CategoriesCodes

class CategoriesCodesRepository:
    @staticmethod
    def get_category_codes_by_id(session, category_id: int):
        return session.query(CategoriesCodes).filter(CategoriesCodes.id == category_id).first()

    @staticmethod
    def get_category_code_by_type_and_code(session, type: str, code: str):
        return session.query(CategoriesCodes).filter(
            CategoriesCodes.type == type,
            CategoriesCodes.code == code
        ).first()

    @staticmethod
    def get_category_by_type_and_sort(session, type: str, sort: int):
        return session.query(CategoriesCodes).filter(
            CategoriesCodes.type == type,
            CategoriesCodes.sort == sort
        ).first()

    @staticmethod
    def get_category_by_type_and_value(session, type: str, value: str):
        return session.query(CategoriesCodes).filter(
            CategoriesCodes.type == type,
            CategoriesCodes.value == value
        ).first()

    @staticmethod
    def get_last_code(session, type: str):
        last_count = session.query(CategoriesCodes).filter(
            CategoriesCodes.type == type
        ).count()

        last_count += 1
        type_word = type.split('_')[0].lower()
        code = type_word + f"_{str(last_count).zfill(3)}"
        return code

    @staticmethod
    def create(session, params: dict):
        new_code = CategoriesCodesRepository.get_last_code(session, params["type"])

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
    def update(session, category, params: dict):
        try:
            category.value = params.get("value", category.value)
            category.sort = params.get("sort", category.sort)
            category.is_active = params.get("is_active", category.is_active)
            session.commit()
            session.refresh(category)
        except Exception as e:
            session.rollback()
            raise e

        return category

    @staticmethod
    def apply_filters(query, params: dict):
        from sqlalchemy.inspection import inspect
        mapper = inspect(CategoriesCodes)
        columns = {column.key for column in mapper.columns}

        for key, value in params.items():
            if key in columns and value is not None:
                query = query.filter(getattr(CategoriesCodes, key) == value)


        return query

    @staticmethod
    def get_category_list(session, params: dict):
        query = session.query(CategoriesCodes)

        # 모델 컬럼 목록 가져오기
        query = CategoriesCodesRepository.apply_filters(query, params)

        # 정렬
        order_by = params.get("order_by", "id")
        order_direction = params.get("order_direction", "desc")

        if hasattr(CategoriesCodes, order_by):
            col = getattr(CategoriesCodes, order_by)
            query = query.order_by(col.desc() if order_direction == "desc" else col.asc())

        # 페이징
        if params.get("offset") is not None and params.get("limit") is not None:
            query = query.offset(params["offset"]).limit(params["limit"])

        return query.all()
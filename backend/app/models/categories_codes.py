from sqlalchemy import Column, Integer, String, Index, UniqueConstraint
from app.core.database import Base
from app.libs.serializers.query import SerializerQueryResult

class CategoriesCodes(Base):
    __tablename__ = "categories_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(50), nullable=False, default="", comment="카테고리 타입")
    code = Column(String(50), nullable=False, default="", comment="카테고리 코드")
    value = Column(String(255), nullable=False, default="", comment="카테고리 값")
    sort = Column(Integer, nullable=False, default=0, comment="순서")
    is_active = Column(String(3), nullable=False, default="Y", comment="사용여부")

    # 🔥 Unique 및 Index 설정
    __table_args__ = (
        UniqueConstraint("type", "sort", name="uniq_type_sort"),
        UniqueConstraint("type", "code", name="uniq_type_code"),
        Index("idx_type_code", "type", "code"),
        Index("idx_type_value", "type", "value"),
        Index("idx_is_active", "is_active"),
    )

    def __repr__(self):
        return f"<CategoriesCodes(id={self.id}, type='{self.type}', code='{self.code}')>"

    @staticmethod
    def findById(session, category_id: int):
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
    def getList(session, params: dict):
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

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
        return f"<CategoriesCodes(id={self.id}, type='{self.type}', code='{self.code}', value='{self.value}', sort={self.sort}, is_active='{self.is_active}')>"

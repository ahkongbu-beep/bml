from sqlalchemy import BigInteger, Column, ForeignKey
from app.core.database import Base


class MealsMappers(Base):
    __tablename__ = "meals_mappers"

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        primary_key=True,
        comment="user.pk"
    )
    category_id = Column(
        BigInteger,
        ForeignKey("categories_codes.id"),
        primary_key=True,
        comment="category.pk"
    )

    def __repr__(self):
        return f"<MealsMappers(user_id={self.user_id}, category_id={self.category_id})>"


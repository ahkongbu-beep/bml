from sqlalchemy import Column, BigInteger, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class FeedsTags(Base):
    __tablename__ = "feeds_tags"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)

    mappers = relationship(
        "FeedsTagsMappers",          # ← 문자열이면 import 순서 문제 없어짐
        back_populates="tag",
        cascade="all, delete-orphan"
    )
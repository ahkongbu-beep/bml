from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, func, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Feeds(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="Users.pk")
    ref_meal = Column(Integer, nullable=True, default=0, comment="참조 식단 pk")
    category_id=Column(Integer, nullable=False, default=0, comment="카테고리 pk")
    title = Column(String(255), nullable=False, default="", comment="feed 제목")
    content = Column(Text, nullable=False, comment="feed 내용")
    is_public = Column(Enum('Y', 'N'), default='Y', comment="공개여부")
    is_share_meal_plan = Column(Enum('Y', 'N'), default='Y', comment="식단공유여부")
    meal_condition = Column(String(2), nullable=False, default="2", comment="식사 섭취량")
    meal_stage = Column(Integer, nullable=True, default=0, comment="식사 단계 0: 해당없음, 1: 이유식, 2: 유아식, 3: 일반식")
    meal_stage_detail = Column(String(50), nullable=True, default="", comment="식사 단계 세부 정보 (예: 이유식 단계별 정보)")
    view_count = Column(Integer, nullable=False, default=0, comment="조회수")
    like_count = Column(Integer, nullable=False, default=0, comment="관심수")
    is_deleted = Column(String(1), nullable=False, default='N', comment="삭제여부")
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    deleted_at = Column(DateTime, nullable=True, default=None)

    # 관계 정의
    tags = relationship(
        "FeedsTagsMappers",
        back_populates="feed",
        cascade="all, delete-orphan"
    )

    images = relationship(
        "FeedsImages",
        primaryjoin="and_(Feeds.id==foreign(FeedsImages.img_model_id), FeedsImages.img_model=='Feeds')",
        viewonly=True
    )

    # 인덱스 정의
    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_created_at", "created_at"),
        Index("idx_public_created", "is_public", "created_at"),
    )

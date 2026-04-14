from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime, func as sql_func,
    UniqueConstraint, Index
)
from app.core.database import Base

class MealsCalendars(Base):
    __tablename__ = "meals_calendars"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category_code = Column(Integer, nullable=False, default=0, comment="카테고리의 식사 구분 pk")
    refer_feed_id = Column(Integer, nullable=False, default=0, comment="참조한 피드 pk")
    user_id = Column(Integer, nullable=False, default=0, comment="요청 user.pk")
    child_id = Column(Integer, nullable=True, default=0, comment="자녀 pk")
    meal_stage = Column(Integer, nullable=True, default=0, comment="식사 단계 0: 해당없음, 1: 이유식, 2: 유아식, 3: 일반식")
    meal_stage_detail = Column(String(50), nullable=True, default="", comment="식사 단계 세부 정보 (예: 이유식 단계별 정보)")
    title = Column(String(255), nullable=True, default="", comment="식사제목")
    contents = Column(Text, nullable=True, comment="설명")
    month = Column(String(7), nullable=False, default="", comment="YYYY-MM")
    like_count = Column(Integer, nullable=False, default=0, comment="좋아요 수")
    view_count = Column(Integer, nullable=False, default=0, comment="조회 수")
    input_date = Column(Date, nullable=False, comment="식사일")
    is_pre_made = Column(String(2), nullable=False, default="N", comment="기성품 여부 Y/N")
    is_public = Column(String(2), nullable=False, default="N", comment="공개 여부 Y/N")
    is_active = Column(String(2), nullable=False, default="Y", comment="활성 여부 Y/N")
    meal_condition = Column(String(2), nullable=True, default="", comment="식사 상태")
    created_at = Column(DateTime, server_default=sql_func.now(), comment="등록일")
    updated_at = Column(DateTime, server_default=sql_func.now(), onupdate=sql_func.now(), comment="수정일")
    deleted_at = Column(DateTime, nullable=True, comment="삭제일")
    view_hash = Column(String(255), nullable=False, default="", comment="뷰 해시")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "input_date",
            "category_code",
            "child_id",
            "is_active",
            name="uniq_user_date_type"
        ),
        Index("idx_month", "month"),
        Index("idx_user_date", "user_id", "input_date"),
        Index("idx_input_date", "input_date"),
        Index("idx_user", "user_id"),
        Index("idx_view_hash", "view_hash"),
        Index("idx_refer_feed_id", "refer_feed_id"),
    )

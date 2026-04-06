from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class MealsSummaries(Base):
    __tablename__ = "meals_summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=True, default=0, comment="사용자 ID")
    total_score = Column(Integer, nullable=False, default=0, comment="총점")
    total_summary = Column(Text, nullable=True, comment="총평")
    analysis_json = Column(Text, nullable=True, comment="분석 JSON")
    suggestion = Column(Text, nullable=True, comment="제안사항")
    view_hash = Column(String(255), nullable=False, unique=True, default="", comment="view_hash")
    is_active = Column(String(3), nullable=False, default="Y", comment="사용여부")
    is_temp = Column(String(3), nullable=False, default="Y", comment="임시 여부")
    created_at = Column(DateTime, server_default=func.current_timestamp())
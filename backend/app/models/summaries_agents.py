from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Index,
    JSON,
)

from sqlalchemy.sql import func
from app.core.database import Base

class SummariesAgents(Base):
    __tablename__ = "summaries_agents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, default=0, comment="질의 user 정보")
    model = Column(String(50), nullable=False, default="", comment="model")
    model_id = Column(Integer, nullable=False, default=0, comment="model_id")
    recipe_json = Column(JSON, nullable=True, comment="레시피 정보")
    recipe_hash = Column(String(64), nullable=True, comment="레시피 해시값")
    question = Column(Text, comment="사용자 질의 내용")
    answer = Column(Text, comment="ai 질의 내용")

    view_hash = Column(String(255), nullable=True, comment="view_hash")
    created_at = Column(
        DateTime,
        server_default=func.now(),
        comment="생성일"
    )

    __table_args__ = (
        Index("idx_model_rows", "model", "model_id"),
        Index("idx_created_at", "created_at"),
        Index("idx_view_hash", "view_hash"),
    )

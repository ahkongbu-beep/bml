from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class MealsComments(Base):
    __tablename__ = "meals_comments"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="댓글 ID")
    meal_id = Column(Integer, nullable=False, default=0, comment="meals_calendar.pk")
    user_id = Column(Integer, nullable=False, default=0, comment="users.pk")
    parent_id = Column(Integer, ForeignKey("meals_comments.id"), nullable=True, comment="부모 댓글 ID (대댓글용)")
    comment = Column(Text, nullable=False, comment="댓글 내용")
    created_at = Column(DateTime, server_default=func.now(), nullable=False, comment="작성 시간")
    is_active = Column(String(2), nullable=False, default="Y", comment="활성 여부 (Y/N)")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False, comment="수정 시간")
    deleted_at = Column(DateTime, nullable=True, comment="삭제 시간 (soft delete)")
    view_hash  = Column(Text, nullable=True, comment="view_hash")
    parent_hash = Column(Text, nullable=True, comment="부모 댓글 view_hash")

    # 관계(Relationship) 설정
    parent = relationship("MealsComments", remote_side=[id], backref="children")

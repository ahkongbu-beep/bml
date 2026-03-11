from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, Index
from app.core.database import Base
from datetime import datetime

class Notices(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_id = Column(Integer, nullable=False, comment="관리자 PK")
    category_id = Column(Integer, nullable=False, comment="카테고리 PK")
    title = Column(String(100), nullable=False, default="", comment="공지제목")
    content = Column(Text, nullable=True, comment="공지내용")
    is_important = Column(Enum('Y', 'N'), nullable=False, default='N', comment="중요 여부")
    created_at = Column(DateTime, nullable=False, default=datetime.now, comment="생성일")
    updated_at = Column(DateTime, nullable=False, default=datetime.now, onupdate=datetime.now, comment="수정일")
    ip = Column(String(20), nullable=False, default="", comment="IP")
    status = Column(Enum('active', 'unactive', "deleted"), nullable=False, default='active', comment="상태")
    view_hash = Column(String(255), nullable=False, default='', comment="조회 해시")

    __table_args__ = (
        Index('idx_title_status', 'title', 'status'),
        Index('idx_created_at', 'created_at'),
        Index('view_hash', 'view_hash'),
    )

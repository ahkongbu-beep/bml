from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Enum, Index
from datetime import datetime
from app.core.database import Base

class CommunitiesImages(Base):
    __tablename__ = "communities_images"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    community_id = Column(Integer, nullable=False, comment="커뮤니티 ID (communities.id)")
    image_url = Column(String(500), nullable=False, comment="이미지 경로(URL)")
    sort_order = Column(Integer, nullable=False, default=0, comment="정렬 순서 (0=첫번째)")
    width = Column(Integer, nullable=True, comment="원본 width")
    height = Column(Integer, nullable=True, comment="원본 height")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Enum("Y", "N"), default="Y", nullable=True, comment="사용여부")

    __table_args__ = (
        Index("idx_community_id", "community_id"),
    )

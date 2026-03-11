from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Enum, and_
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.libs.hash_utils import generate_sha256_hash
from app.core.config import settings
import os

class FeedsImages(Base):
    __tablename__ = "feeds_images"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    img_model = Column(String(50), nullable=False, comment="이미지 모델명 (Feeds, Meals 등)")
    img_model_id = Column(Integer, nullable=False, comment="모델 ID (Feeds.id 또는 Meals.id 등)")
    image_url = Column(String(500), nullable=False, comment="이미지 경로(URL)")
    sort_order = Column(Integer, nullable=False, default=0, comment="정렬 순서 (0=첫번째)")
    width = Column(Integer, nullable=True, comment="원본 width")
    height = Column(Integer, nullable=True, comment="원본 height")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Enum("Y", "N"), default="Y", nullable=True, comment="사용여부")

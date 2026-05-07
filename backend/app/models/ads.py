from sqlalchemy import Column, Integer, Text, DateTime, String, Enum, ForeignKey
from sqlalchemy.sql import func

from app.core.database import Base

class Ads(Base):
    __tablename__ = "ads"
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    advertiser_id = Column(Integer, ForeignKey("advertisers.id"), nullable=False, index=True, comment="광고주 PK")
    amount = Column(Integer, nullable=False, default=0, comment="광고비용")
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Enum("Y", "N", name="ad_active_enum"), nullable=False, default="Y", comment="사용 여부")
    contents = Column(Text, nullable=True, comment="설명")
    target_link = Column(Text, nullable=True, comment="광고 클릭 시 이동할 링크")
    click_count = Column(Integer, nullable=False, default=0, comment="클릭 수")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    view_hash = Column(String(255), nullable=False, default="", unique=True, comment="view_hash")
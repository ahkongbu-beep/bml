from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from datetime import datetime
from app.core.database import Base

class AdsClickLog(Base):
    __tablename__ = "ads_clicks_logs"

    __table_args__ = (
        Index("idx_ads_id", "ads_id"),
        Index("idx_user_id", "user_id"),
        Index("idx_created_at", "created_at"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    ads_id = Column(Integer, nullable=False, default=0, comment="광고.pk")
    user_id = Column(Integer, nullable=False, default=0, comment="user.pk")
    ip = Column(String(20), nullable=False, default="", comment="클릭 ip")
    user_agent = Column(Text, nullable=True, comment="user_agent")
    created_at = Column(DateTime, nullable=False, default=datetime.now, comment="생성일시")
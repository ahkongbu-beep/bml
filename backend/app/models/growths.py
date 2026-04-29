from sqlalchemy import (Column, Integer, String, Enum, DECIMAL, Index, UniqueConstraint)
from app.core.database import Base

class Growths(Base):
    __tablename__ = "growths"
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(50), nullable=False, comment="타입")
    months = Column(DECIMAL(4, 1), nullable=False, comment="개월수")
    gender = Column(Enum('M', 'W', name='gender_enum'), nullable=False, comment="성별")
    percent = Column(String(10), nullable=False, default="", comment="백분률")
    value = Column( DECIMAL(4, 1), nullable=False, default=0.00, comment="수치")
    is_active = Column(Enum('Y', 'N', name='active_enum'), nullable=False, default='Y', comment="사용여부")
    __table_args__ = (
        UniqueConstraint('type', 'months', 'gender', 'percent', name='unique_growth'),
        Index('idx_growth', 'type', 'gender'),
    )
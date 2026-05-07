from sqlalchemy import Column, Index, Integer, String, Text, DateTime, Enum, UniqueConstraint
from sqlalchemy.sql import func

from app.core.database import Base

class Advertiser(Base):
    __tablename__ = "advertisers"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    company = Column(String(50), nullable=False, default="", comment="회사명")
    company_number = Column(String(20), nullable=False, default="", comment="사업자번호")
    account_id = Column(String(50), nullable=False, default="", comment="광고 담당자ID")
    account_name = Column(String(50), nullable=False, default="", comment="광고 담당자명")
    account_email = Column(String(100), nullable=False, default="", comment="광고 담당자 이메일")
    account_tel = Column(String(20), nullable=False, default="", comment="광고 담당자 연락처")
    account_image = Column(String(255), nullable=False, default="", comment="광고담당자 프로필이미지")
    company_biz = Column(String(30), nullable=False, default="", comment="업태")
    company_item = Column(String(30), nullable=False, default="", comment="업종")
    is_active = Column(Enum("Y", "N", name="advertiser_active_enum"), nullable=False, default="Y", comment="사용여부")
    description = Column(Text, nullable=True, comment="비고")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    view_hash = Column(String(255), nullable=False, default="", unique=True, comment="view_hash")
    __table_args__ = (
        UniqueConstraint(
            "company_number",
            "account_id",
            "is_active",
            name="uniq_account"
        ),
        Index("idx_company", "company"),
    )
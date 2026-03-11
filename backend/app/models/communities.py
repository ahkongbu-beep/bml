from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    DateTime,
    CHAR,
    Index,
    func
)
from app.core.database import Base


class Community(Base):
    __tablename__ = "communities"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    category_code = Column(Integer, nullable=False, default=0, comment="분류코드")
    user_id = Column(Integer, nullable=False, default=0, comment="회원 ID")
    title = Column(String(255), nullable=False, default="", comment="title")
    contents = Column(Text, comment="contents")
    user_nickname = Column(String(50), nullable=False, default="", comment="작성 시점 닉네임")
    user_ip = Column(String(30), nullable=False, default="", comment="작성자 IP")
    view_count = Column(Integer, nullable=False, default=0, comment="조회수")
    like_count = Column(Integer, nullable=False, default=0, comment="좋아요수")
    is_secret = Column(CHAR(1), nullable=False, default="N", comment="비밀글 여부(Y/N)")
    is_active = Column(CHAR(1), nullable=False, default="Y", comment="사용여부(Y/N)")
    is_notice = Column(CHAR(1), nullable=False, default="N", comment="공지글 여부")
    created_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        comment="등록시간"
    )
    updated_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="수정시간"
    )
    deleted_at = Column(DateTime, nullable=True, comment="삭제시간")
    pinned_at = Column(DateTime, nullable=True, comment="고정시간(공지글인경우)")
    view_hash = Column(String(255), nullable=False, default="", comment="조회용 해시")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_is_active", "is_active"),
        Index("idx_created_at", "created_at"),
    )

from sqlalchemy import Column, Integer, String, Enum, DateTime, UniqueConstraint, text
from app.core.database import Base

class IngredientsRequests(Base):
    __tablename__ = "ingredients_requests"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="Users.pk")
    name = Column(String(255), nullable=False, default="", comment="재료 이름")
    status = Column(Enum('Y', 'N'), default='N', comment="요청 상태 (Y: 승인, N: 대기)")
    created_at = Column(
        DateTime,
        nullable=False,
        server_default=text('CURRENT_TIMESTAMP')
    )
    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='uniq_user_name_status'),
    )
"""
회원테이블 가이드
- create() 시점에 필요한 사항
- view_hash(sns_login_type + sns_id + name + email + phone)  sha256 해시값으로 생성하여 저장
- password 는 argon2-cffi 해시값으로 저장하여 복호화할수 없게함
"""

from sqlalchemy import (Column, Integer, String, Enum, Date, DateTime, Text, SmallInteger, UniqueConstraint, Index)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import enum
from datetime import datetime
import pytz

from app.libs.hash_utils import generate_sha256_hash
from app.libs.password_utils import hash_password, verify_password
from app.core.database import Base
from app.core.config import settings

# Enum 정의
class SnsLoginTypeEnum(str, enum.Enum):
    EMAIL = 'EMAIL'
    KAKAO = 'KAKAO'
    NAVER = 'NAVER'
    GOOGLE = 'GOOGLE'

class RoleEnum(str, enum.Enum):
    USER = 'USER'
    ADMIN = 'ADMIN'

class GenderEnum(str, enum.Enum):
    M = 'M'
    W = 'W'


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sns_login_type = Column(Enum(SnsLoginTypeEnum), nullable=False, default=SnsLoginTypeEnum.EMAIL)
    sns_id = Column(String(255), nullable=False, default='')
    address = Column(String(255), nullable=False, default='')
    password = Column(String(255), nullable=True, default=None)
    name = Column(String(50), nullable=False, default='')
    nickname = Column(String(50), nullable=False, default='')
    email = Column(String(255), nullable=False, default='')
    phone = Column(String(20), nullable=False, default='')
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.USER)
    profile_image = Column(String(255), nullable=False, default='')
    description = Column(Text, nullable=True)
    is_active = Column(SmallInteger, nullable=False, default=1)
    marketing_agree = Column(SmallInteger, nullable=False, default=0)
    push_agree = Column(SmallInteger, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime(1970,1,1))
    updated_at = Column(DateTime, nullable=False, default=datetime(1970,1,1))
    last_login_at = Column(DateTime, nullable=False, default=datetime(1970,1,1))
    referer_token = Column(Text, nullable=True)
    deleted_at = Column(DateTime, nullable=True, default=None)
    view_hash = Column(String(255), nullable=True, default=None)

    # Relationships
    meal_group = relationship("MealsMappers", backref="user", lazy="joined")

    __table_args__ = (
        UniqueConstraint('email', name='uq_users_email'),
        UniqueConstraint('sns_login_type', 'sns_id', name='uq_users_sns'),
        UniqueConstraint('view_hash', name='uq_users_view_hash'),

        Index('idx_users_role', 'role'),
        Index('idx_users_is_active', 'is_active'),
        Index('idx_users_created_at', 'created_at'),
        Index('idx_users_last_login_at', 'last_login_at'),
    )

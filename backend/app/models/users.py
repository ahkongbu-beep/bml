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
    child_birth = Column(Date, nullable=True, default=None)
    child_gender = Column(Enum(GenderEnum), nullable=False, default=GenderEnum.M)
    child_age_group = Column(Integer, nullable=False, default=0)
    marketing_agree = Column(SmallInteger, nullable=False, default=0)
    push_agree = Column(SmallInteger, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=datetime(1970,1,1))
    updated_at = Column(DateTime, nullable=False, default=datetime(1970,1,1))
    last_login_at = Column(DateTime, nullable=False, default=datetime(1970,1,1))
    deleted_at = Column(DateTime, nullable=True, default=None)
    view_hash = Column(String(255), nullable=True, default=None)

    # Relationships
    meal_group = relationship("MealsMappers", backref="user", lazy="joined")

    __table_args__ = (
        UniqueConstraint('email', name='uq_users_email'),
        UniqueConstraint('phone', name='uq_users_phone'),
        UniqueConstraint('sns_login_type', 'sns_id', name='uq_users_sns'),
        UniqueConstraint('view_hash', name='uq_users_view_hash'),

        Index('idx_users_role', 'role'),
        Index('idx_users_is_active', 'is_active'),
        Index('idx_users_created_at', 'created_at'),
        Index('idx_users_last_login_at', 'last_login_at'),
        Index('idx_child_birth', 'child_birth'),
        Index('idx_child_age_group', 'child_age_group'),
    )

    @staticmethod
    def findById(session, user_id: int):
        """
        PK로 회원 조회
        """
        return session.query(Users).filter(Users.id == user_id).first()

    @staticmethod
    def findByViewHash(session, view_hash: str):
        """
        view_hash로 회원 조회
        """
        return session.query(Users).filter(Users.view_hash == view_hash).first()

    @staticmethod
    def create(session, params: dict, is_commit: bool = True):
        """
        회원 생성

        필수 params:
        - sns_login_type: SnsLoginTypeEnum
        - sns_id: str
        - name: str
        - email: str
        - phone: str

        선택 params:
        - password: str (EMAIL 로그인 시 필수)
        - nickname: str
        - address: str
        - profile_image: str
        - description: str
        - child_birth: date
        - child_gender: GenderEnum
        - child_age_group: int
        - marketing_agree: int (0 or 1)
        - push_agree: int (0 or 1)
        """
        kst = pytz.timezone("Asia/Seoul")
        now = datetime.now(kst)

        # view_hash 생성 (sns_login_type + sns_id + name + email + phone)
        view_hash = generate_sha256_hash(
            params['sns_login_type'],
            params['sns_id'],
            params['name'],
            params['email'],
            params['phone']
        )

        # password 해싱 (argon2)
        hashed_password = None
        if params.get('sns_login_type') == 'EMAIL' and params.get('password'):
            hashed_password = hash_password(params['password'])

        # 사용자 생성
        user = Users(
            sns_login_type=params['sns_login_type'],
            sns_id=params['sns_id'],
            name=params['name'],
            email=params['email'],
            phone=params['phone'],
            password=hashed_password,
            nickname=params.get('nickname', params['name']),  # 기본값: name
            address=params.get('address', ''),
            profile_image=params.get('profile_image', ''),
            description=params.get('description', None),
            role=params.get('role', RoleEnum.USER),
            is_active=params.get('is_active', 1),
            child_birth=params.get('child_birth', None),
            child_gender=params.get('child_gender', GenderEnum.M),
            child_age_group=params.get('child_age_group', 0),
            marketing_agree=params.get('marketing_agree', 0),
            push_agree=params.get('push_agree', 0),
            created_at=now,
            updated_at=now,
            last_login_at=now,
            view_hash=view_hash
        )

        session.add(user)
        if is_commit:
            session.commit()
            session.refresh(user)
        else:
            session.flush()  # ID를 생성하기 위해 flush
            session.refresh(user)

        return user

    @staticmethod
    def update(session, user_instance, params: dict):
        """
        회원정보 수정 시 수정 가능한 항목을 미리 정의
        미리 저장한 항목이 아닌 경우 update 해주지않음
        """

        validate_keys = [
            "nickname",
            "address",
            "profile_image",
            "description",
            "child_birth",
            "password",
            "marketing_agree",
            "push_agree",
            "child_gender",
            "child_age_group",
            "is_active",
        ]

        try:
            for key, value in params.items():
                """ 해당 속성이 없을 경우 continue """
                if not hasattr(user_instance, key):
                    continue

                """ 수정가능한 항목이 아니면 continue """
                if key not in validate_keys:
                    continue

                """ 비밀번호일 경우 해싱 처리 """
                if key == "password":

                    """ 빈 문자열일 경우 패스 """
                    if not value.strip():
                        continue

                    if user_instance.sns_login_type != "EMAIL":
                        continue

                    value = hash_password(value)

                if key == "child_birth" and value:
                    try:
                        value = datetime.strptime(value, "%Y-%m-%d").date()
                    except:
                        raise ValueError("child_birth 형식이 올바르지 않습니다. YYYY-MM-DD 형식이어야 합니다.")

                if key == "child_age_group":
                    value = int(value)

                setattr(user_instance, key, value)

            kst = pytz.timezone("Asia/Seoul")
            user_instance.updated_at = datetime.now(kst)

            session.commit()
            session.refresh(user_instance)
            return user_instance

        except Exception as e:
            session.rollback()
            raise e

    @staticmethod
    def verify_password_deprecated(stored_password: str, provided_password: str) -> bool:
        """
        비밀번호 검증 (Deprecated: app.libs.password_utils.verify_password 사용 권장)

        Args:
            stored_password: 데이터베이스에 저장된 해시된 비밀번호
            provided_password: 사용자가 입력한 평문 비밀번호

        Returns:
            bool: 비밀번호 일치 여부
        """
        return verify_password(stored_password, provided_password)

    @staticmethod
    def update_last_login(session, user_id: int):
        """
        마지막 로그인 시간 업데이트
        """
        kst = pytz.timezone("Asia/Seoul")
        now = datetime.now(kst)

        user = session.query(Users).filter(Users.id == user_id).first()
        if user:
            user.last_login_at = now
            session.commit()
            session.refresh(user)

        return user
from sqlalchemy import Column, Integer, DateTime, UniqueConstraint, Index
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class DeniesUsers(Base):
    __tablename__ = "denies_users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, nullable=False, default=0, comment="요청 user.pk")
    deny_user_id = Column(Integer, nullable=False, default=0, comment="차단 user.pk")

    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "deny_user_id", name="uq_deny_user"),
        Index("idx_user_id", "user_id"),
    )

    """
    user_id 로 차단한 회원 목록 조회
    """
    @staticmethod
    def findByUserIds(session, user_id: int):
        return session.query(DeniesUsers).filter(
            DeniesUsers.user_id == user_id
        ).all()

    """
    user_id 와 deny_user_id 로 차단 정보 조회
    """
    @staticmethod
    def findByUserIdAndDenyUserId(session, user_id: int, deny_user_id: int):
        return session.query(DeniesUsers).filter(
            DeniesUsers.user_id == user_id,
            DeniesUsers.deny_user_id == deny_user_id
        ).first()



    """
    차단 정보 생성
    """
    @staticmethod
    def create(session, params: dict):
        deny_entry = DeniesUsers(
            user_id=params.get("user_id"),
            deny_user_id=params.get("deny_user_id")
        )

        session.add(deny_entry)
        session.commit()
        session.refresh(deny_entry)
        return deny_entry

    @staticmethod
    def deleteByUserIdAndDenyUserId(session, user_id: int, deny_user_id: int):
        session.query(DeniesUsers).filter(
            DeniesUsers.user_id == user_id,
            DeniesUsers.deny_user_id == deny_user_id
        ).delete()
        session.commit()

    """
    user_id 로 차단한 리스트 조회
    """
    @staticmethod
    def findDenyUsersByUserId(session, user_id: int):
        from app.models.users import Users
        query = (
            session.query(
                Users.view_hash,
                Users.nickname,
                Users.profile_image,
                DeniesUsers.created_at.label("blocked_at")
            ).join(
                DeniesUsers,
                Users.id == DeniesUsers.deny_user_id
            )
        )

        query = query.filter(
            DeniesUsers.user_id == user_id
        )



        result = query.order_by(DeniesUsers.created_at.desc()).all()
        return QueryResult(result)

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.users_schemas import DenyUserResponse

        return [
            DenyUserResponse(
                user_hash=v.view_hash,
                nickname=v.nickname,
                profile_image=v.profile_image,
                blocked_at=v.blocked_at
            )
            for v in self._results
        ]

    def toDict(self):
        """딕셔너리 리스트 반환"""
        return [
            {
                "user_hash": v.view_hash,
                "nickname": v.nickname,
                "profile_image": v.profile_image,
                "blocked_at": v.blocked_at
            }
            for v in self._results
        ]

    def toJSON(self):
        """JSON 문자열 반환"""
        import json
        return json.dumps(self.toDict(), ensure_ascii=False, default=str)

    def getRawData(self):
        """원본 SQLAlchemy 객체 반환"""
        return self._results
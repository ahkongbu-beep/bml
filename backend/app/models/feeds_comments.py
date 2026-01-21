import datetime
import pytz
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, case
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.users import Users
from app.models.feeds import Feeds
from app.libs.hash_utils import generate_sha256_hash

class FeedsComments(Base):
    __tablename__ = "feeds_comments"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="댓글 ID")
    feed_id = Column(Integer, nullable=False, default=0, comment="피드 ID")
    user_id = Column(Integer, nullable=False, default=0, comment="댓글 작성자 직원 ID")
    parent_id = Column(Integer, ForeignKey("feeds_comments.id"), nullable=True, comment="부모 댓글 ID (대댓글용)")

    comment = Column(Text, nullable=False, comment="댓글 내용")

    created_at = Column(DateTime, server_default=func.now(), nullable=False, comment="작성 시간")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False, comment="수정 시간")
    deleted_at = Column(DateTime, nullable=True, comment="삭제 시간 (soft delete)")
    view_hash  = Column(Text, nullable=True, comment="view_hash")
    parent_hash = Column(Text, nullable=True, comment="부모 댓글 view_hash")

    # 관계(Relationship) 설정
    parent = relationship("FeedsComments", remote_side=[id], backref="children")

    @staticmethod
    def findByViewHash(session, view_hash: str):
        return session.query(FeedsComments).filter(FeedsComments.view_hash == view_hash).first()

    @staticmethod
    def deleteById(session, comment_id: int):
        comment = session.query(FeedsComments).filter(FeedsComments.id == comment_id).first()
        comment.deleted_at = datetime.datetime.now(pytz.timezone("Asia/Seoul"))
        try:
            session.commit()
            return True
        except Exception as e:
            session.rollback()

        return False

    @staticmethod
    def create(session, params: dict):
        kst = pytz.timezone("Asia/Seoul")
        now = datetime.datetime.now(kst)
        # view_hash 생성
        view_hash = generate_sha256_hash(
            params['feed_id'],
            params['user_id'],
            params['parent_id'] if 'parent_id' in params else '',
            now.strftime("%Y%m%d%H%M%S%f")
        )
        try:
            comment = FeedsComments(
                feed_id=params.get("feed_id"),
                user_id=params.get("user_id"),
                parent_id=params.get("parent_id", 0),
                comment=params.get("comment"),
                view_hash=view_hash,
                parent_hash=params.get("parent_hash", "")
            )

            session.add(comment)
            session.commit()
            session.refresh(comment)
            return comment
        except Exception as e:
            session.rollback()
            raise e

    @staticmethod
    def getList(session, params: dict, extra: dict):
        user_id = params.get("user_id", None)

        query = (
            session.query(
                FeedsComments.feed_id,
                FeedsComments.comment,
                FeedsComments.parent_id,
                FeedsComments.created_at,
                FeedsComments.updated_at,
                FeedsComments.deleted_at,
                FeedsComments.view_hash.label("view_hash"),
                FeedsComments.parent_hash.label("parent_hash"),
                case(
                    (FeedsComments.user_id == user_id, True),
                    else_=False
                ).label("is_owner"),
                Users.nickname,
                Users.profile_image,
                Users.view_hash.label("user_hash"),
            )
            .join(Users, Users.id == FeedsComments.user_id, isouter=True)
        )

        query = query.filter(FeedsComments.feed_id == params["feed_id"])
        query = query.order_by(FeedsComments.created_at.asc())

        if "limit" in extra:
            query = query.limit(extra["limit"])
        if "offset" in extra:
            query = query.offset(extra["offset"])

        result = query.all()
        return QueryResult(result)

    @staticmethod
    def build_comment_tree(comments):
        """댓글 트리 구조 생성 - Pydantic 모델용"""
        comment_dict = {comment.view_hash: comment for comment in comments}
        root_comments = []

        for comment in comments:
            if comment.parent_hash:
                parent_comment = comment_dict.get(comment.parent_hash)
                if parent_comment:
                    # Pydantic 모델의 children 리스트에 추가
                    parent_comment.children.append(comment)
            else:
                root_comments.append(comment)

        return root_comments

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.feeds_schemas import FeedsCommentResponse, FeedsUserResponse

        return [
            FeedsCommentResponse(
                feed_id=v.feed_id,
                comment=v.comment,
                parent_id=v.parent_id,
                is_owner=v.is_owner,
                created_at=v.created_at,
                updated_at=v.updated_at,
                deleted_at=v.deleted_at,
                view_hash=v.view_hash,
                parent_hash=v.parent_hash,
                user=FeedsUserResponse(
                    id=v.user_id if hasattr(v, 'user_id') else None,
                    nickname=v.nickname,
                    profile_image=v.profile_image,
                    user_hash=v.user_hash
                )
            )
            for v in self._results
        ]

    def toDict(self):
        """딕셔너리 리스트 반환"""
        return [
            {
                "feed_id": v.feed_id,
                "comment": v.comment,
                "parent_id": v.parent_id,
                "is_owner": v.is_owner,
                "created_at": v.created_at,
                "updated_at": v.updated_at,
                "deleted_at": v.deleted_at,
                "view_hash": v.view_hash,
                "parent_hash": v.parent_hash,
                "user": {
                    "nickname": v.nickname,
                    "profile_image": v.profile_image,
                    "user_hash": v.user_hash
                }
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
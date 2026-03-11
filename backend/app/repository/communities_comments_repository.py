from app.models.communities_comments import CommunitiesComments
import datetime
import pytz
from sqlalchemy import case
from app.models.users import Users
from app.libs.hash_utils import generate_sha256_hash

class CommunitiesCommentsRepository:
    # 커뮤니티 댓글 생성
    @staticmethod
    def find_by_view_hash(session, view_hash: str):
        return session.query(CommunitiesComments).filter(CommunitiesComments.view_hash == view_hash).first()

    @staticmethod
    def delete_by_id(session, comment_id: int):
        comment = session.query(CommunitiesComments).filter(CommunitiesComments.id == comment_id).first()
        comment.deleted_at = datetime.datetime.now(pytz.timezone("Asia/Seoul"))
        try:
            session.commit()
            return True
        except Exception as e:
            session.rollback()

        return False

    @staticmethod
    def soft_delete(session, comment: 'CommunitiesComments'):
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
            params['community_id'],
            params['user_id'],
            params['parent_id'] if 'parent_id' in params else '',
            now.strftime("%Y%m%d%H%M%S%f")
        )
        try:
            comment = CommunitiesComments(
                community_id=params.get("community_id"),
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
    def update(session, comment: 'CommunitiesComments', params: dict, is_commit: bool = True):
        try:
            comment.comment = params.get("comment", comment.comment)
            comment.updated_at = datetime.datetime.now(pytz.timezone("Asia/Seoul"))

            if is_commit:
                session.commit()
            else:
                session.flush()  # 변경사항을 DB에 반영하여 ID를 생성하기 위해 flush
            return comment
        except Exception as e:
            session.rollback()
            raise e

    @staticmethod
    def get_list(session, params: dict, extra: dict):
        user_id = params.get("user_id", None)

        query = (
            session.query(
                CommunitiesComments.community_id,
                CommunitiesComments.comment,
                CommunitiesComments.parent_id,
                CommunitiesComments.created_at,
                CommunitiesComments.updated_at,
                CommunitiesComments.deleted_at,
                CommunitiesComments.view_hash.label("view_hash"),
                CommunitiesComments.parent_hash.label("parent_hash"),
                case(
                    (CommunitiesComments.user_id == user_id, True),
                    else_=False
                ).label("is_owner"),
                Users.nickname,
                Users.profile_image,
                Users.view_hash.label("user_hash"),
            )
            .join(Users, Users.id == CommunitiesComments.user_id, isouter=True)
        )

        query = query.filter(CommunitiesComments.community_id == params["community_id"])
        query = query.filter(CommunitiesComments.deleted_at.is_(None))
        query = query.order_by(CommunitiesComments.created_at.asc())

        if "limit" in extra:
            query = query.limit(extra["limit"])
        if "offset" in extra:
            query = query.offset(extra["offset"])

        result = query.all()
        return QueryResult(result)

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.feeds_schemas import FeedsUserResponse
        from app.schemas.communities_schemas import CommunityCommentResponse

        return [
            CommunityCommentResponse(
                community_id=v.community_id,
                comment=v.comment,
                parent_id=v.parent_id,
                is_owner=v.is_owner,
                created_at=v.created_at,
                updated_at=v.updated_at,
                deleted_at=v.deleted_at,
                view_hash=v.view_hash,
                parent_hash=v.parent_hash,
                user=FeedsUserResponse(
                    nickname=v.nickname,
                    profile_image=v.profile_image if v.profile_image else None,
                    user_hash=v.user_hash
                )
            )
            for v in self._results
        ]

    def toDict(self):
        """딕셔너리 리스트 반환"""
        return [
            {
                "community_id": v.community_id,
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
                    "profile_image": v.profile_image if v.profile_image else None,
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
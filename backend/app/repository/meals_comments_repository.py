import pytz
import datetime
from app.models.users import Users
from app.models.meals_comments import MealsComments
from app.libs.hash_utils import generate_sha256_hash
from sqlalchemy import case

class MealsCommentsRepository:

    def list_by_user_id(session, user_id: int):
        return session.query(MealsComments).filter(MealsComments.user_id == user_id).all()

    @staticmethod
    def find_by_view_hash(session, view_hash: str):
        return session.query(MealsComments).filter(MealsComments.view_hash == view_hash).first()

    @staticmethod
    def get_comment_by_view_hash(session, view_hash: str):
        return session.query(MealsComments).filter(MealsComments.view_hash == view_hash).first()


    @staticmethod
    def soft_delete(session, comment, is_commit=True):
        comment.deleted_at = datetime.datetime.now(pytz.timezone("Asia/Seoul"))
        comment.is_active = "N"
        try:
            if is_commit:
                session.commit()
            else:
                session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음
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
            params['meal_id'],
            params['user_id'],
            params['parent_id'] if 'parent_id' in params else '',
            now.strftime("%Y%m%d%H%M%S%f")
        )
        try:
            comment = MealsComments(
                meal_id=params.get("meal_id"),
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
    def get_list(session, params: dict, extra: dict):
        user_id = params.get("user_id", None)

        query = (
            session.query(
                MealsComments.meal_id,
                MealsComments.comment,
                MealsComments.parent_id,
                MealsComments.created_at,
                MealsComments.updated_at,
                MealsComments.deleted_at,
                MealsComments.view_hash.label("view_hash"),
                MealsComments.parent_hash.label("parent_hash"),
                case(
                    (MealsComments.user_id == user_id, True),
                    else_=False
                ).label("is_owner"),
                Users.nickname,
                Users.profile_image,
                Users.view_hash.label("user_hash"),
            )
            .join(Users, Users.id == MealsComments.user_id, isouter=True)
        )

        query = query.filter(MealsComments.meal_id == params["meal_id"])
        query = query.filter(MealsComments.is_active == "Y")
        query = query.order_by(MealsComments.created_at.asc())

        if "limit" in extra:
            query = query.limit(extra["limit"])
        if "offset" in extra:
            query = query.offset(extra["offset"])

        return query.all()


class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.feeds_schemas import FeedsCommentResponse, FeedsUserResponse

        return [
            FeedsCommentResponse(
                meal_id=v.meal_id,
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

    def toJSON(self):
        """JSON 문자열 반환"""
        import json
        return json.dumps(self.toDict(), ensure_ascii=False, default=str)

    def getRawData(self):
        """원본 SQLAlchemy 객체 반환"""
        return self._results
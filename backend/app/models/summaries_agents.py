from operator import and_
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Index,
    select
)
import datetime
import pytz
from sqlalchemy.sql import func
from app.core.database import Base
from app.libs.hash_utils import generate_sha256_hash
from app.models.feeds import Feeds
from app.models.feeds_images import FeedsImages
from app.models.users import Users

class SummariesAgents(Base):
    __tablename__ = "summaries_agents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, default=0, comment="질의 user 정보")
    model = Column(String(50), nullable=False, default="", comment="model")
    model_id = Column(Integer, nullable=False, default=0, comment="model_id")
    question = Column(Text, comment="사용자 질의 내용")
    answer = Column(Text, comment="ai 질의 내용")

    view_hash = Column(String(255), nullable=True, comment="view_hash")
    created_at = Column(
        DateTime,
        server_default=func.now(),
        comment="생성일"
    )

    __table_args__ = (
        Index("idx_model_rows", "model", "model_id"),
        Index("idx_created_at", "created_at"),
        Index("idx_view_hash", "view_hash"),
    )

    @staticmethod
    def findByModelIdAndQuestion(session, model: str, model_id: int, question: str):
        return session.query(SummariesAgents).filter(
            SummariesAgents.model == model,
            SummariesAgents.model_id == model_id,
            SummariesAgents.question == question
        ).first()

    @staticmethod
    def findUsedCountByUserId(session, user_id: int):
        return session.query(SummariesAgents).filter(SummariesAgents.user_id == user_id).count()

    @staticmethod
    def getListByFeedImages(session, params, offset=0, limit=10):
        query = (
            select(
                Feeds.title.label("title"),
                Feeds.id.label("feed_id"),
                SummariesAgents.question.label("question"),
                SummariesAgents.answer.label("answer"),
                SummariesAgents.created_at.label("created_at"),
                FeedsImages.image_url.label("feed_image_url"),
            )
            .select_from(SummariesAgents)
            .outerjoin(FeedsImages, and_(
                SummariesAgents.model_id == FeedsImages.id,
                FeedsImages.img_model == "Feeds"
            ))
            .outerjoin(Feeds, FeedsImages.img_model_id == Feeds.id)
        )

        if 'user_id' in params:
            query = query.where(SummariesAgents.user_id == params['user_id'])

        if 'model' in params:
            query = query.where(SummariesAgents.model == params['model'])

        if 'model_id' in params:
            query = query.where(SummariesAgents.model_id == params['model_id'])

        if 'query' in params:
            query = query.where(SummariesAgents.question.ilike(f"%{params['query']}%"))

        count_query = (select(func.count()).select_from(query.subquery()))
        total_count = session.execute(count_query).scalar()

        query = (
            query
            .order_by(SummariesAgents.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        results = session.execute(query).all()
        return results, total_count

    @staticmethod
    def create(session, params: dict, is_commit=True):

        kst = pytz.timezone("Asia/Seoul")
        now = datetime.datetime.now(kst)

        view_hash = generate_sha256_hash(
            params['user_id'],
            params['model'],
            params['model_id'],
            params['question'],
            now.strftime("%Y%m%d%H%M%S%f")
        )

        summary_agent = SummariesAgents(
            user_id=params.get("user_id"),
            model=params.get("model"),
            model_id=params.get("model_id"),
            question=params.get("question"),
            answer=params.get("answer"),
            view_hash=view_hash
        )

        session.add(summary_agent)

        if is_commit:
            session.commit()
            session.refresh(summary_agent)

        return summary_agent

    @staticmethod
    def getList(session, params: dict, offset=0, limit=10):


        query = (
            session.query(
                SummariesAgents.id,
                SummariesAgents.model,
                SummariesAgents.model_id,
                SummariesAgents.question,
                SummariesAgents.answer,
                SummariesAgents.created_at,
                SummariesAgents.view_hash,
                Users.view_hash.label("user_view_hash"),
                Users.nickname.label("nickname"),
                Users.profile_image.label("profile_image")
            ).join(Users, SummariesAgents.user_id == Users.id)
        )

        if 'user_id' in params:
            query = query.filter(SummariesAgents.user_id == params['user_id'])

        if 'model' in params:
            query = query.filter(SummariesAgents.model == params['model'])

            if 'search_type' in params and 'search_value' in params and params['search_type'] == 'model_id':
                query = query.filter(SummariesAgents.model_id == int(params['search_value']))

        if 'model_id' in params:
            query = query.filter(SummariesAgents.model_id == params['model_id'])

        if 'search_type' in params and 'search_value' in params:
            if params['search_type'] == 'question':
                query = query.filter(SummariesAgents.question.ilike(f"%{params['search_value']}%"))

        results = (
            query
            .order_by(SummariesAgents.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return QueryResult(results)

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.summary_schemas import SummaryFeedResponse
        from app.schemas.feeds_schemas import FeedsUserResponse
        kst = pytz.timezone("Asia/Seoul")

        return [
            SummaryFeedResponse(
                summary_id=v.id,
                model=v.model,
                model_id=v.model_id,
                question=v.question,
                answer=v.answer,
                created_at=v.created_at.astimezone(kst).strftime("%Y-%m-%d %H:%M:%S"),
                view_hash=v.view_hash,
                user=FeedsUserResponse(
                    nickname=v.nickname,
                    profile_image=v.profile_image,
                    user_hash=v.user_view_hash
                )

            )
            for v in self._results
        ]

    def toDict(self):
        """딕셔너리 리스트 반환"""
        kst = pytz.timezone("Asia/Seoul")
        return [
            {
                "model": v.model,
                "model_id": v.model_id,
                "question": v.question,
                "answer": v.answer,
                "created_at": v.created_at.astimezone(kst).strftime("%Y-%m-%d %H:%M:%S"),
                "view_hash": v.view_hash,
                "user": {
                    "nickname": v.nickname,
                    "profile_image": v.profile_image,
                    "user_hash": v.user_view_hash
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
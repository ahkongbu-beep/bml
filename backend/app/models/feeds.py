from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, func, Index
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.config import settings

class Feeds(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="Users.pk")
    title = Column(String(255), nullable=False, default="", comment="feed 제목")
    content = Column(Text, nullable=False, comment="feed 내용")
    is_public = Column(Enum('Y', 'N'), default='Y', comment="공개여부")
    view_count = Column(Integer, nullable=False, default=0, comment="조회수")
    like_count = Column(Integer, nullable=False, default=0, comment="관심수")
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())

    # 관계 정의
    tags = relationship(
        "FeedsTagsMapper",
        back_populates="feed",
        cascade="all, delete-orphan"
    )

    images = relationship(
        "FeedsImages",
        back_populates="feed",
        cascade="all, delete-orphan"
    )

    # 인덱스 정의
    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_created_at", "created_at"),
        Index("idx_public_created", "is_public", "created_at"),
    )

    @staticmethod
    def create(session, params: dict):
        feed = Feeds(
            user_id=params.get("user_id"),
            title=params.get("title", ""),
            content=params.get("content", ""),
            is_public=params.get("is_public", 'Y'),
            view_count=params.get("view_count", 0),
            like_count=params.get("like_count", 0)
        )

        session.add(feed)
        session.commit()
        session.refresh(feed)
        return feed

    @staticmethod
    def update(session, feed_id: int, params: dict):
        feed = session.query(Feeds).filter(Feeds.id == feed_id).first()
        if not feed:
            return None

        feed.title = params.get("title", feed.title)
        feed.content = params.get("content", feed.content)
        feed.is_public = params.get("is_public", feed.is_public)

        session.commit()
        session.refresh(feed)
        return feed

    @staticmethod
    def findById(session, feed_id: int):
        """
        PK로 피드 조회
        """
        return session.query(Feeds).filter(Feeds.id == feed_id).first()

    @staticmethod
    def getList(session, params: dict, extra: dict = {}):
        from sqlalchemy import func as sql_func
        from app.models.feeds_tags_mappers import FeedsTagsMapper
        from app.models.feeds_tags import FeedsTags
        from app.models.feeds_images import FeedsImages
        from app.models.users import Users

        # 페이징 처리
        limit = extra.get("limit", 20)
        offset = extra.get("offset", 0)

        # 서브쿼리: 각 피드의 태그들을 콤마로 연결
        subquery = (
            session.query(
                FeedsTagsMapper.feed_id,
                sql_func.group_concat(FeedsTags.name).label('tags')
            )
            .join(FeedsTags, FeedsTagsMapper.tag_id == FeedsTags.id)
            .group_by(FeedsTagsMapper.feed_id)
            .subquery()
        )

        image_subquery = (
            session.query(
                FeedsImages.feed_id,
                sql_func.group_concat(FeedsImages.image_url).label('images')
            )
            .group_by(FeedsImages.feed_id)
            .subquery()
        )

        # 메인 쿼리: Feeds와 Users, 태그, 이미지 조인
        query = (
            session.query(
                Feeds.id,
                Feeds.user_id,
                Feeds.title,
                Feeds.content,
                Feeds.is_public,
                Feeds.view_count,
                Feeds.like_count,
                Feeds.created_at,
                Feeds.updated_at,
                subquery.c.tags,
                image_subquery.c.images,
                Users.nickname,
                Users.profile_image
            )
            .join(Users, Feeds.user_id == Users.id)
            .outerjoin(subquery, Feeds.id == subquery.c.feed_id)
            .outerjoin(image_subquery, Feeds.id == image_subquery.c.feed_id)
        )

        if params.get("is_public"):
            query = query.filter(Feeds.is_public == params["is_public"])

        if params.get("user_id"):
            query = query.filter(Feeds.user_id == params["user_id"])

        if params.get("title"):
            query = query.filter(Feeds.title.like(f"%{params['title']}%"))

        result = query.order_by(Feeds.created_at.desc()).offset(offset).limit(limit).all()

        return QueryResult(result)

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.feeds_schemas import FeedsResponse, FeedsUserResponse

        return [
            FeedsResponse(
                id=v.id,
                user_id=v.user_id,
                title=v.title,
                content=v.content,
                is_published=v.is_public,
                view_count=v.view_count,
                like_count=v.like_count,
                created_at=v.created_at,
                updated_at=v.updated_at,
                images=[settings.BACKEND_SHOP_URL + image for image in v.images.split(',')] if hasattr(v, 'images') and v.images else [],
                tags=v.tags.split(',') if v.tags else [],
                user=FeedsUserResponse(
                    nickname=v.nickname,
                    profile_image=v.profile_image
                )
            )
            for v in self._results
        ]

    def toDict(self):
        """딕셔너리 리스트 반환"""
        return [
            {
                "id": v.id,
                "user_id": v.user_id,
                "title": v.title,
                "content": v.content,
                "is_published": v.is_public,
                "view_count": v.view_count,
                "like_count": v.like_count,
                "created_at": v.created_at,
                "updated_at": v.updated_at,
                "images": [settings.BACKEND_SHOP_URL + image for image in v.images.split(',')] if hasattr(v, 'images') and v.images else [],
                "tags": v.tags.split(',') if v.tags else [],
                "user": {
                    "nickname": v.nickname,
                    "profile_image": v.profile_image
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
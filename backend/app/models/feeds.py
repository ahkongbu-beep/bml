from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, func, Index, case, and_
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.core.config import settings

class Feeds(Base):
    __tablename__ = "feeds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, comment="Users.pk")
    category_id=Column(Integer, nullable=False, default=0, comment="카테고리 pk")
    title = Column(String(255), nullable=False, default="", comment="feed 제목")
    content = Column(Text, nullable=False, comment="feed 내용")
    is_public = Column(Enum('Y', 'N'), default='Y', comment="공개여부")
    view_count = Column(Integer, nullable=False, default=0, comment="조회수")
    like_count = Column(Integer, nullable=False, default=0, comment="관심수")
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    is_share_meal_plan = Column(Enum('Y', 'N'), default='Y', comment="식단공유여부")

    # 관계 정의
    tags = relationship(
        "FeedsTagsMapper",
        back_populates="feed",
        cascade="all, delete-orphan"
    )

    images = relationship(
        "FeedsImages",
        primaryjoin="and_(Feeds.id==foreign(FeedsImages.img_model_id), FeedsImages.img_model=='Feeds')",
        viewonly=True
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
            category_id=params.get("category_id", 0),
            view_count=params.get("view_count", 0),
            like_count=params.get("like_count", 0),
            is_share_meal_plan=params.get("is_share_meal_plan", 'N'),
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
        feed.is_share_meal_plan = params.get("is_share_meal_plan", feed.is_share_meal_plan)
        feed.category_id = params.get("category_id", feed.category_id)

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
        from app.models.feeds_likes import FeedsLikes
        from app.models.users_childs import UsersChilds
        from app.models.users import Users

        # 페이징 처리
        limit = extra.get("limit", 20)
        offset = extra.get("offset", 0)

        order_by = Feeds.created_at.desc()
        if extra.get("order_by") == "like_count_desc":
            order_by = Feeds.like_count.desc()
        elif extra.get("order_by") == "like_count_asc":
            order_by = Feeds.like_count.asc()

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
                FeedsImages.img_model_id.label('feed_id'),
                sql_func.group_concat(FeedsImages.image_url).label('images'),
                sql_func.group_concat(FeedsImages.id).label('image_ids')
            )
            .filter(FeedsImages.img_model == 'Feeds')
            .group_by(FeedsImages.img_model_id)
            .subquery()
        )

        # 대표 자녀 서브쿼리 (user_id별로 하나만 선택)
        from sqlalchemy import func as sql_func, literal_column

        user_childs_subquery = (
            session.query(
                UsersChilds.user_id,
                sql_func.max(UsersChilds.child_name).label('child_name'),
                sql_func.max(UsersChilds.child_birth).label('child_birth'),
                sql_func.max(UsersChilds.child_gender).label('child_gender')
            )
            .filter(UsersChilds.is_agent == 'Y')
            .group_by(UsersChilds.user_id)
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
                image_subquery.c.image_ids,
                Users.nickname,
                Users.profile_image,
                Users.view_hash,
                user_childs_subquery.c.child_name,
                user_childs_subquery.c.child_birth,
                user_childs_subquery.c.child_gender,
                case(
                    (FeedsLikes.id.isnot(None), True),
                    else_=False
                ).label("is_liked")
            )
            .join(Users, Feeds.user_id == Users.id)
            .outerjoin(user_childs_subquery, Feeds.user_id == user_childs_subquery.c.user_id)
            .join(
                FeedsLikes,
                (Feeds.id == FeedsLikes.feed_id) &
                (FeedsLikes.user_id == params.get("my_user_id")),
                isouter=True
            )
            .outerjoin(subquery, Feeds.id == subquery.c.feed_id)
            .outerjoin(image_subquery, Feeds.id == image_subquery.c.feed_id)
        )

        if params.get("is_public"):
            query = query.filter(Feeds.is_public == params["is_public"])

        # target_user_id가 있으면 해당 사용자의 피드만 조회
        if params.get("target_user_id"):
            query = query.filter(Feeds.user_id == params["target_user_id"])
        elif params.get("type") != "list" and params.get("user_id"):
            query = query.filter(Feeds.user_id == params["user_id"])

        if params.get("title"):
            query = query.filter(Feeds.title.like(f"%{params['title']}%"))

        if params.get("deny_user_ids"):
            query = query.filter(Feeds.user_id.notin_(params["deny_user_ids"]))

        if params.get("nickname"):
            query = query.filter(Users.nickname.like(f"%{params['nickname']}%"))

        if params.get("start_date") and params.get("end_date"):
            query = query.filter(Feeds.created_at.between(params["start_date"], params["end_date"]))

        result = query.order_by(order_by).offset(offset).limit(limit).all()

        return QueryResult(result)

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.feeds_schemas import FeedsResponse, FeedsUserResponse
        from app.schemas.users_schemas import UserChildItemSchema

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
                is_liked=v.is_liked,
                images=[img.replace('\\', '/') for img in v.images.split(',')] if v.images else [],
                tags=v.tags.split(',') if v.tags else [],
                user=FeedsUserResponse(
                    id=v.user_id,
                    nickname=v.nickname,
                    profile_image=v.profile_image,
                    user_hash=v.view_hash
                ),
                childs=UserChildItemSchema(
                    child_name=v.child_name,
                    child_birth=v.child_birth,
                    child_gender=v.child_gender,
                    is_agent='Y'
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
                "is_liked": v.is_liked,
                "images": [img.replace('\\', '/') for img in v.images.split(',')] if v.images else [],
                "tags": v.tags.split(',') if v.tags else [],
                "user": {
                    "nickname": v.nickname,
                    "profile_image": v.profile_image,
                    "user_hash": v.view_hash
                },
                "childs": {
                    "child_name": v.child_name,
                    "child_birth": v.child_birth,
                    "child_gender": v.child_gender
                }
            }
            for v in self._results
        ]

    def toJSON(self):
        """JSON 문자열 반환"""
        import json
        return json.dumps(self.toDict(), ensure_ascii=False, default=str)

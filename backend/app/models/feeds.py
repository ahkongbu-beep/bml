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
    is_share_meal_plan = Column(Enum('Y', 'N'), default='Y', comment="식단공유여부")
    meal_condition = Column(String(2), nullable=False, default="2", comment="식사 섭취량")
    view_count = Column(Integer, nullable=False, default=0, comment="조회수")
    like_count = Column(Integer, nullable=False, default=0, comment="관심수")
    is_deleted = Column(String(1), nullable=False, default='N', comment="삭제여부")
    created_at = Column(DateTime, server_default=func.current_timestamp())
    updated_at = Column(DateTime, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    deleted_at = Column(DateTime, nullable=True, default=None)

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
    def create(session, params: dict, is_commit: bool = True):
        feed = Feeds(
            user_id=params.get("user_id"),
            title=params.get("title", ""),
            content=params.get("content", ""),
            is_public=params.get("is_public", 'Y'),
            meal_condition=params.get("meal_condition", "2"),
            category_id=params.get("category_id", 0),
            view_count=params.get("view_count", 0),
            like_count=params.get("like_count", 0),
            is_share_meal_plan=params.get("is_share_meal_plan", 'N'),
        )

        session.add(feed)
        if is_commit:
            session.commit()
            session.refresh(feed)
        else:
            session.flush()  # ID를 즉시 사용할 수 있도록 flush
        return feed

    @staticmethod
    def update(session, feed_id: int, params: dict, is_commit: bool = True):
        feed = session.query(Feeds).filter(Feeds.id == feed_id).first()
        if not feed:
            return None

        feed.title = params.get("title", feed.title)
        feed.content = params.get("content", feed.content)
        feed.is_public = params.get("is_public", feed.is_public)
        feed.is_share_meal_plan = params.get("is_share_meal_plan", feed.is_share_meal_plan)
        feed.category_id = params.get("category_id", feed.category_id)
        feed.meal_condition = params.get("meal_condition", feed.meal_condition)
        if is_commit:
            session.commit()
            session.refresh(feed)
        else:
            session.flush()
        return feed

    @staticmethod
    def findById(session, feed_id: int):
        """
        PK로 피드 조회
        """
        return session.query(Feeds).filter(
            Feeds.id == feed_id,
            Feeds.is_deleted == 'N',
            Feeds.deleted_at.is_(None)
        ).first()

    @staticmethod
    def delete_by_feed(session, feed_id: int, is_commit=True):
        """
        피드 삭제(soft)
        """
        feed = session.query(Feeds).filter(Feeds.id == feed_id).first()
        if not feed:
            return False

        try:
            feed.is_deleted = 'Y'
            feed.deleted_at = func.current_timestamp()
            if is_commit:
                session.commit()
            else:
                session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음
        except:
            session.rollback()
            return False

        return True

    @staticmethod
    def get_list(session, params: dict, extra: dict = {}):
        from sqlalchemy import func as sql_func
        from app.models.feeds_tags_mappers import FeedsTagsMapper
        from app.models.feeds_tags import FeedsTags
        from app.models.feeds_images import FeedsImages
        from app.models.feeds_likes import FeedsLikes
        from app.models.users_childs import UsersChilds
        from app.models.users_childs_allergies import UserChildAllergy
        from app.models.users import Users
        from app.models.categories_codes import CategoriesCodes

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

        category_subquery = (
            session.query(
                CategoriesCodes.id,
                CategoriesCodes.value.label("category_name")
            )
            .subquery()
        )

        from sqlalchemy import distinct

        # 대표 자녀 정보 + 알레르기 정보 서브쿼리 (통합)
        user_childs_subquery = (
            session.query(
                UsersChilds.user_id,
                sql_func.max(UsersChilds.child_name).label('child_name'),
                sql_func.max(UsersChilds.child_birth).label('child_birth'),
                sql_func.max(UsersChilds.child_gender).label('child_gender'),
                sql_func.max(UsersChilds.is_agent).label('is_agent'),
                sql_func.group_concat(
                    distinct(UserChildAllergy.allergy_name)
                ).label("allergy_names"),
                sql_func.group_concat(
                    distinct(UserChildAllergy.allergy_code)
                ).label("allergy_codes")
            )
            .outerjoin(UserChildAllergy, UserChildAllergy.child_id == UsersChilds.id)
            .filter(UsersChilds.is_agent == 'Y')
            .group_by(UsersChilds.user_id)
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
                Feeds.meal_condition,
                Feeds.category_id,
                Feeds.created_at,
                Feeds.updated_at,
                subquery.c.tags,
                image_subquery.c.images,
                image_subquery.c.image_ids,
                category_subquery.c.category_name,
                Users.nickname,
                Users.profile_image,
                Users.view_hash,
                user_childs_subquery.c.child_name,
                user_childs_subquery.c.child_birth,
                user_childs_subquery.c.child_gender,
                user_childs_subquery.c.allergy_names,
                user_childs_subquery.c.allergy_codes,
                user_childs_subquery.c.is_agent,
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
            .outerjoin(category_subquery, Feeds.category_id == category_subquery.c.id)
        )

        if params.get("is_public"):
            query = query.filter(Feeds.is_public == params["is_public"])

        if params.get("view_type") == "mine":
            query = query.filter(Feeds.user_id == params["my_user_id"])

        if params.get("category_id"):
            query = query.filter(Feeds.category_id == params["category_id"])

        if params.get("is_deleted"):
            query = query.filter(Feeds.is_deleted == params["is_deleted"])

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

        # cursor 기반 페이징: cursor(last_id)보다 작은 id만 조회
        if params.get("cursor"):
            query = query.filter(Feeds.id < params["cursor"])

        result = query.order_by(order_by).offset(offset).limit(limit).all()

        return QueryResult(result)

class QueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.feeds_schemas import FeedsResponse, FeedsUserResponse
        from app.schemas.users_schemas import UserChildItemSchema, AllergyItemSchema

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
                meal_condition=v.meal_condition,
                category_id=v.category_id,
                category_name=v.category_name,
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
                    is_agent=v.is_agent,
                    allergies=[
                        AllergyItemSchema(
                            allergy_code=code.strip() if code else None,
                            allergy_name=name.strip()
                        )
                        for code, name in zip(
                            v.allergy_codes.split(',') if v.allergy_codes else [],
                            v.allergy_names.split(',') if v.allergy_names else []
                        )
                    ] if v.allergy_names else []
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
                "meal_condition": v.meal_condition,
                "category_id": v.category_id,
                "category_name": v.category_name,
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
                    "child_gender": v.child_gender,
                    "is_agent": v.is_agent,
                    "allergies": [
                        {
                            "allergy_code": code.strip() if code else None,
                            "allergy_name": name.strip()
                        }
                        for code, name in zip(
                            v.allergy_codes.split(',') if v.allergy_codes else [],
                            v.allergy_names.split(',') if v.allergy_names else []
                        )
                    ] if v.allergy_names else []
                }
            }
            for v in self._results
        ]

    def toJSON(self):
        """JSON 문자열 반환"""
        import json
        return json.dumps(self.toDict(), ensure_ascii=False, default=str)

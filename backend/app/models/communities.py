from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    String,
    Text,
    DateTime,
    CHAR,
    Index,
    func
)
from app.core.database import Base
from app.models.users_childs import UsersChilds
from app.libs.serializers.query import SerializerQueryResult
from app.libs.hash_utils import generate_sha256_hash
from datetime import datetime
import pytz


class Community(Base):
    __tablename__ = "communities"
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    category_code = Column(Integer, nullable=False, default=0, comment="분류코드")
    user_id = Column(Integer, nullable=False, default=0, comment="회원 ID")
    title = Column(String(255), nullable=False, default="", comment="title")
    contents = Column(Text, comment="contents")
    user_nickname = Column(String(50), nullable=False, default="", comment="작성 시점 닉네임")
    user_ip = Column(String(30), nullable=False, default="", comment="작성자 IP")
    view_count = Column(Integer, nullable=False, default=0, comment="조회수")
    like_count = Column(Integer, nullable=False, default=0, comment="좋아요수")
    is_secret = Column(CHAR(1), nullable=False, default="N", comment="비밀글 여부(Y/N)")
    is_active = Column(CHAR(1), nullable=False, default="Y", comment="사용여부(Y/N)")
    is_notice = Column(CHAR(1), nullable=False, default="N", comment="공지글 여부")
    created_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        comment="등록시간"
    )
    updated_at = Column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="수정시간"
    )
    deleted_at = Column(DateTime, nullable=True, comment="삭제시간")
    pinned_at = Column(DateTime, nullable=True, comment="고정시간(공지글인경우)")
    view_hash = Column(String(255), nullable=False, default="", comment="조회용 해시")

    __table_args__ = (
        Index("idx_user_id", "user_id"),
        Index("idx_is_active", "is_active"),
        Index("idx_created_at", "created_at"),
    )

    @staticmethod
    def findByViewHash(db, view_hash):
        return db.query(Community).filter(Community.view_hash == view_hash, Community.deleted_at.is_(None)).first()

    @staticmethod
    def create(db, params, is_commit=True):
        now = datetime.now(pytz.timezone('Asia/Seoul'))

        view_hash = generate_sha256_hash(
            params['user_id'],
            params['user_nickname'],
            params['user_ip'],
            now
        )

        params['view_hash'] = view_hash
        params['created_at'] = now
        params['updated_at'] = now

        community = Community(**params)

        db.add(community)
        if is_commit:
            db.commit()
            db.refresh(community)
        return community

    @staticmethod
    def soft_delete(db, community, is_commit=True):
        community.is_active = 'N'
        community.deleted_at = datetime.now(pytz.timezone('Asia/Seoul'))

        db.add(community)
        if is_commit:
            db.commit()
            db.refresh(community)
        return community

    @staticmethod
    def get_list(db, user_id, params):
        """
        커뮤니티 목록 조회
        params:
            - category_code: 분류코드 (0-6, 6-12, 12-24, 24-36, 48+)
            - is_notice: 공지글 여부
            - is_secret: 비밀글 여부
            - keyword: 검색 키워드
            - month: 조회 월 (YYYY-MM)
            - cursor: 커서 기반 페이징 (마지막 항목의 id)
            - my_only: 내 글만 보기
            - limit: 조회 개수
        """
        from sqlalchemy import func as sql_func, case, and_, or_
        from app.models.users import Users
        from app.models.communities_likes import CommunitiesLikes
        from app.models.communities_comments import CommunitiesComments

        # 기본값 설정
        limit = params.get("limit", 20)
        cursor = params.get("cursor")

        # 메인 쿼리
        query = (
            db.query(
                Community.id,
                Community.category_code,
                Community.user_id,
                Community.title,
                Community.contents,
                Community.user_nickname,
                Community.like_count,
                Community.view_count,
                Community.is_secret,
                Community.is_active,
                Community.is_notice,
                Community.created_at,
                Community.updated_at,
                Community.pinned_at,
                Community.view_hash,
                Users.nickname,
                Users.profile_image,
                Users.view_hash.label("user_hash"),
                UsersChilds.child_name,
                UsersChilds.child_birth,
                UsersChilds.child_gender,
                case(
                    (CommunitiesLikes.id.is_(None), 'N'),
                    else_='Y'
                ).label("is_liked")
                # 코멘트 카운트 구하기
                , (
                    db.query(func.count(CommunitiesComments.id))
                    .filter(
                        CommunitiesComments.community_id == Community.id,
                        CommunitiesComments.deleted_at.is_(None)
                    )
                    .correlate(Community)
                    .as_scalar()
                ).label("comment_count")
            )
            .join(Users, Community.user_id == Users.id)
            .join(UsersChilds, and_(Users.id == UsersChilds.user_id, UsersChilds.is_agent == 'Y'), isouter=True)
            .filter(Community.deleted_at.is_(None))
            .filter(Community.is_active == 'Y')
            .outerjoin(CommunitiesLikes, and_(Community.id == CommunitiesLikes.community_id, CommunitiesLikes.user_id == user_id))
        )

        # 분류코드 필터
        if params.get("category_code") is not None and params.get("category_code") != "all":
            query = query.filter(Community.category_code == params["category_code"])

        # 공지글 여부
        if params.get("is_notice") is not None:
            query = query.filter(Community.is_notice == params["is_notice"])

        # 비밀글 여부
        if params.get("is_secret") is not None:
            query = query.filter(Community.is_secret == params["is_secret"])

        # 검색 키워드
        if params.get("keyword"):
            keyword = params["keyword"]
            query = query.filter(
                or_(
                    Community.title.like(f"%{keyword}%"),
                    Community.contents.like(f"%{keyword}%"),
                    Community.user_nickname.like(f"%{keyword}%")
                )
            )

        # 월별 필터
        if params.get("month"):
            month = params["month"]  # YYYY-MM 형식
            query = query.filter(
                sql_func.date_format(Community.created_at, '%Y-%m') == month
            )

        # 날짜 범위 필터
        if params.get("start_date"):
            start_date = params["start_date"]  # YYYY-MM-DD 형식
            query = query.filter(
                sql_func.date(Community.created_at) >= start_date
            )

        if params.get("end_date"):
            end_date = params["end_date"]  # YYYY-MM-DD 형식
            query = query.filter(
                sql_func.date(Community.created_at) <= end_date
            )

        # 회원 닉네임 검색
        if params.get("user_nickname"):
            user_nickname = params["user_nickname"]
            query = query.filter(Users.nickname.like(f"%{user_nickname}%"))

        # 내 글만 보기
        if params.get("my_only") and params["my_only"]:
            query = query.filter(Community.user_id == user_id)

        # 커서 기반 페이징
        if cursor:
            query = query.filter(Community.id < cursor)

        # 정렬
        sort_by = params.get("sort_by", "latest")
        if sort_by == "likes":
            # TODO: 좋아요 수 필드 추가 후 구현
            query = query.order_by(
                Community.is_notice.desc(),
                Community.pinned_at.desc(),
                Community.id.desc()
            )
        elif sort_by == "views":
            query = query.order_by(
                Community.is_notice.desc(),
                Community.pinned_at.desc(),
                Community.view_count.desc(),
                Community.id.desc()
            )
        else:  # latest (기본값)
            query = query.order_by(
                Community.is_notice.desc(),
                Community.pinned_at.desc(),
                Community.id.desc()
            )

        # 결과 조회
        result = query.limit(limit).all()

        return SerializerQueryResult(result)

    @staticmethod
    def get_list_count(db, user_id, params) -> int:
        """커뮤니티 목록 총 개수"""
        from sqlalchemy import or_
        from app.models.users import Users

        query = (
            db.query(Community.id)
            .join(Users, Community.user_id == Users.id)
            .filter(Community.deleted_at.is_(None))
            .filter(Community.is_active == 'Y')
        )

        # 분류코드 필터
        if params.get("category_code") is not None and params.get("category_code") != "all":
            query = query.filter(Community.category_code == params["category_code"])

        # 공지글 여부
        if params.get("is_notice") is not None:
            query = query.filter(Community.is_notice == params["is_notice"])

        # 비밀글 여부
        if params.get("is_secret") is not None:
            query = query.filter(Community.is_secret == params["is_secret"])

        # 검색 키워드
        if params.get("keyword"):
            keyword = params["keyword"]
            query = query.filter(
                or_(
                    Community.title.like(f"%{keyword}%"),
                    Community.contents.like(f"%{keyword}%"),
                    Community.user_nickname.like(f"%{keyword}%")
                )
            )

        # 월별 필터
        if params.get("month"):
            from sqlalchemy import func as sql_func
            month = params["month"]
            query = query.filter(
                sql_func.date_format(Community.created_at, '%Y-%m') == month
            )

        # 날짜 범위 필터
        if params.get("start_date"):
            from sqlalchemy import func as sql_func
            start_date = params["start_date"]
            query = query.filter(
                sql_func.date(Community.created_at) >= start_date
            )

        if params.get("end_date"):
            from sqlalchemy import func as sql_func
            end_date = params["end_date"]
            query = query.filter(
                sql_func.date(Community.created_at) <= end_date
            )

        # 회원 닉네임 검색
        if params.get("user_nickname"):
            user_nickname = params["user_nickname"]
            query = query.filter(Users.nickname.like(f"%{user_nickname}%"))

        # 내 글만 보기
        if params.get("my_only") and params["my_only"]:
            query = query.filter(Community.user_id == user_id)

        return query.count()

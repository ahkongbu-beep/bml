
from app.models.communities import Communities
from app.models.users_childs import UsersChilds
from app.libs.serializers.query import SerializerQueryResult
from app.libs.hash_utils import generate_sha256_hash
from datetime import datetime
import pytz

class CommunitiesRepository:

    @staticmethod
    def find_by_view_hash(db, view_hash):
        return db.query(Communities).filter(Communities.view_hash == view_hash, Communities.deleted_at.is_(None)).first()

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

        community = Communities(**params)

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
        from app.models.communities_images import CommunitiesImages

        # 기본값 설정
        limit = params.get("limit", 20)
        cursor = params.get("cursor")

        # 이미지 서브쿼리: 각 커뮤니티의 이미지들을 콤마로 연결
        image_subquery = (
            db.query(
                CommunitiesImages.community_id,
                sql_func.group_concat(CommunitiesImages.image_url).label('images')
            )
            .group_by(CommunitiesImages.community_id)
            .subquery()
        )

        # 메인 쿼리
        query = (
            db.query(
                Communities.id,
                Communities.category_code,
                Communities.user_id,
                Communities.title,
                Communities.contents,
                Communities.user_nickname,
                Communities.like_count,
                Communities.view_count,
                Communities.is_secret,
                Communities.is_active,
                Communities.is_notice,
                Communities.created_at,
                Communities.updated_at,
                Communities.pinned_at,
                Communities.view_hash,
                image_subquery.c.images,
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
                    db.query(sql_func.count(CommunitiesComments.id))
                    .filter(
                        CommunitiesComments.community_id == Communities.id,
                        CommunitiesComments.deleted_at.is_(None)
                    )
                    .correlate(Communities)
                    .as_scalar()
                ).label("comment_count")
            )
            .join(Users, Communities.user_id == Users.id)
            .join(UsersChilds, and_(Users.id == UsersChilds.user_id, UsersChilds.is_agent == 'Y'), isouter=True)
            .outerjoin(image_subquery, Communities.id == image_subquery.c.community_id)
            .filter(Communities.deleted_at.is_(None))
            .filter(Communities.is_active == 'Y')
            .outerjoin(CommunitiesLikes, and_(Communities.id == CommunitiesLikes.community_id, CommunitiesLikes.user_id == user_id))
        )

        # 분류코드 필터
        if params.get("category_code") is not None and params.get("category_code") != "all":
            query = query.filter(Communities.category_code == params["category_code"])

        # 공지글 여부
        if params.get("is_notice") is not None:
            query = query.filter(Communities.is_notice == params["is_notice"])

        # 비밀글 여부
        if params.get("is_secret") is not None:
            query = query.filter(Communities.is_secret == params["is_secret"])

        # 검색 키워드
        if params.get("keyword"):
            keyword = params["keyword"]
            query = query.filter(
                or_(
                    Communities.title.like(f"%{keyword}%"),
                    Communities.contents.like(f"%{keyword}%"),
                    Communities.user_nickname.like(f"%{keyword}%")
                )
            )

        # 월별 필터
        if params.get("month"):
            month = params["month"]  # YYYY-MM 형식
            query = query.filter(
                sql_func.date_format(Communities.created_at, '%Y-%m') == month
            )

        # 날짜 범위 필터
        if params.get("start_date"):
            start_date = params["start_date"]  # YYYY-MM-DD 형식
            query = query.filter(
                sql_func.date(Communities.created_at) >= start_date
            )

        if params.get("end_date"):
            end_date = params["end_date"]  # YYYY-MM-DD 형식
            query = query.filter(
                sql_func.date(Communities.created_at) <= end_date
            )

        # 회원 닉네임 검색
        if params.get("user_nickname"):
            user_nickname = params["user_nickname"]
            query = query.filter(Users.nickname.like(f"%{user_nickname}%"))

        # 내 글만 보기
        if params.get("my_only") and params["my_only"]:
            query = query.filter(Communities.user_id == user_id)

        # 커서 기반 페이징
        if cursor:
            query = query.filter(Communities.id < cursor)

        # 정렬
        sort_by = params.get("sort_by", "latest")
        if sort_by == "likes":
            # TODO: 좋아요 수 필드 추가 후 구현
            query = query.order_by(
                Communities.is_notice.desc(),
                Communities.pinned_at.desc(),
                Communities.id.desc()
            )
        elif sort_by == "views":
            query = query.order_by(
                Communities.is_notice.desc(),
                Communities.pinned_at.desc(),
                Communities.view_count.desc(),
                Communities.id.desc()
            )
        else:  # latest (기본값)
            query = query.order_by(
                Communities.is_notice.desc(),
                Communities.pinned_at.desc(),
                Communities.id.desc()
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
            db.query(Communities.id)
            .join(Users, Communities.user_id == Users.id)
            .filter(Communities.deleted_at.is_(None))
            .filter(Communities.is_active == 'Y')
        )

        # 분류코드 필터
        if params.get("category_code") is not None and params.get("category_code") != "all":
            query = query.filter(Communities.category_code == params["category_code"])

        # 공지글 여부
        if params.get("is_notice") is not None:
            query = query.filter(Communities.is_notice == params["is_notice"])

        # 비밀글 여부
        if params.get("is_secret") is not None:
            query = query.filter(Communities.is_secret == params["is_secret"])

        # 검색 키워드
        if params.get("keyword"):
            keyword = params["keyword"]
            query = query.filter(
                or_(
                    Communities.title.like(f"%{keyword}%"),
                    Communities.contents.like(f"%{keyword}%"),
                    Users.nickname.like(f"%{keyword}%")
                )
            )

        # 월별 필터
        if params.get("month"):
            from sqlalchemy import func as sql_func
            month = params["month"]
            query = query.filter(
                sql_func.date_format(Communities.created_at, '%Y-%m') == month
            )

        # 날짜 범위 필터
        if params.get("start_date"):
            from sqlalchemy import func as sql_func
            start_date = params["start_date"]
            query = query.filter(
                sql_func.date(Communities.created_at) >= start_date
            )

        if params.get("end_date"):
            from sqlalchemy import func as sql_func
            end_date = params["end_date"]
            query = query.filter(
                sql_func.date(Communities.created_at) <= end_date
            )

        # 회원 닉네임 검색
        if params.get("user_nickname"):
            user_nickname = params["user_nickname"]
            query = query.filter(Users.nickname.like(f"%{user_nickname}%"))

        # 내 글만 보기
        if params.get("my_only") and params["my_only"]:
            query = query.filter(Communities.user_id == user_id)

        return query.count()

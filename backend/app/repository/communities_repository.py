
from sqlalchemy import and_

from app.models.communities import Communities
from app.models.users_childs import UsersChilds

from app.libs.hash_utils import generate_sha256_hash
from datetime import datetime
import pytz

class CommunitiesRepository:

    def increase_view_count(db, community, is_commit=True):
        """
        커뮤니티 글 조회수 증가 함수
        """
        community.view_count += 1
        db.add(community)

        if is_commit:
            db.commit()
            db.refresh(community)

    @staticmethod
    def get_community_by_id(db, community_id):
        return db.query(Communities).filter(Communities.id == community_id, Communities.deleted_at.is_(None)).first()

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
    def apply_filters(query, params: dict, include=None):
        from sqlalchemy import or_, func as sql_func

        if include is None:
            include = []

        # 항상 적용: 삭제·비활성 제외
        query = query.filter(
            Communities.deleted_at.is_(None),
            Communities.is_active == 'Y'
        )

        # 분류코드 (전체인 경우 "all" 무시)
        if params.get("category_code") is not None and params.get("category_code") != "all":
            query = query.filter(Communities.category_code == params["category_code"])

        # 공지글 여부
        if params.get("is_notice") is not None:
            query = query.filter(Communities.is_notice == params["is_notice"])

        # 비밀글 여부
        if params.get("is_secret") is not None:
            query = query.filter(Communities.is_secret == params["is_secret"])

        # 검색 키워드 (제목·내용·닉네임 OR)
        if params.get("keyword"):
            keyword = params["keyword"]
            query = query.filter(
                or_(
                    Communities.title.like(f"%{keyword}%"),
                    Communities.contents.like(f"%{keyword}%"),
                    Communities.user_nickname.like(f"%{keyword}%")
                )
            )

        # 월별 필터 (YYYY-MM)
        if params.get("month"):
            query = query.filter(
                sql_func.date_format(Communities.created_at, '%Y-%m') == params["month"]
            )

        # 날짜 범위 필터 (개별 적용)
        if params.get("start_date"):
            query = query.filter(
                sql_func.date(Communities.created_at) >= params["start_date"]
            )
        if params.get("end_date"):
            query = query.filter(
                sql_func.date(Communities.created_at) <= params["end_date"]
            )

        # 닉네임 검색 — "user" include로 이미 Users join된 경우 join 생략
        if params.get("user_nickname"):
            from app.models.users import Users
            if "user" not in include:
                query = query.join(Users, Communities.user_id == Users.id)
            query = query.filter(Users.nickname.like(f"%{params['user_nickname']}%"))

        # 내 글만 보기
        if params.get("my_only") and params.get("user_id"):
            query = query.filter(Communities.user_id == params["user_id"])

        # 커서 기반 페이징
        if params.get("cursor"):
            query = query.filter(Communities.id < params["cursor"])

        return query

    @staticmethod
    def build_base_query(session, params, include=None, base_query=None):
        from sqlalchemy import case, func as sql_func, literal

        if include is None:
            include = []

        query = base_query if base_query is not None else session.query(Communities)

        if "user" in include:
            from app.models.users import Users
            query = query.join(Users, Communities.user_id == Users.id).add_columns(
                Users.nickname,
                Users.profile_image,
                Users.view_hash.label("user_hash"),
            )

        if "child" in include:
            query = query.outerjoin(
                UsersChilds,
                and_(Communities.user_id == UsersChilds.user_id, UsersChilds.is_agent == 'Y')
            ).add_columns(
                UsersChilds.child_name,
                UsersChilds.child_birth,
                UsersChilds.child_gender,
            )

        if "like" in include and params.get("user_id"):
            from app.models.communities_likes import CommunitiesLikes
            query = query.outerjoin(
                CommunitiesLikes,
                and_(
                    Communities.id == CommunitiesLikes.community_id,
                    CommunitiesLikes.user_id == params["user_id"]
                )
            ).add_columns(
                case(
                    (CommunitiesLikes.id.is_(None), literal('N')),
                    else_=literal('Y')
                ).label("is_liked")
            )

        if "image" in include:
            from app.models.attaches_files import AttachesFiles
            image_subquery = (
                session.query(
                    AttachesFiles.img_model_id.label("community_id"),
                    sql_func.group_concat(AttachesFiles.image_url).label("images")
                )
                .filter(AttachesFiles.img_model == "Communities")
                .group_by(AttachesFiles.img_model_id)
                .subquery()
            )
            query = query.outerjoin(
                image_subquery, Communities.id == image_subquery.c.community_id
            ).add_columns(image_subquery.c.images)

        if "comment_count" in include:
            from app.models.communities_comments import CommunitiesComments
            comment_count_col = (
                session.query(sql_func.count(CommunitiesComments.id))
                .filter(
                    CommunitiesComments.community_id == Communities.id,
                    CommunitiesComments.deleted_at.is_(None)
                )
                .correlate(Communities)
                .as_scalar()
            ).label("comment_count")
            query = query.add_columns(comment_count_col)

        return query

    @staticmethod
    def get_community_list(session, user_id, params, include=None):
        """
        커뮤니티 리스트 조회
        """
        from sqlalchemy import case, func as sql_func, literal

        if include is None:
            include = ["user", "child", "like", "image", "comment_count"]

        # user_id를 params에 주입해 apply_filters(my_only, like)에서 사용
        effective_params = dict(params)
        effective_params["user_id"] = user_id

        # ORM 엔티티 대신 명시적 컬럼 선택 → serialize_community에서 row.id 등 직접 접근 가능
        base_query = session.query(
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
        )

        query = CommunitiesRepository.build_base_query(session, effective_params, include, base_query=base_query)
        query = CommunitiesRepository.apply_filters(query, effective_params, include)

        # 정렬: is_notice·pinned_at 우선, sort_by 반영
        sort_by = effective_params.get("sort_by", "latest")
        if sort_by == "views":
            query = query.order_by(
                Communities.is_notice.desc(),
                Communities.pinned_at.desc(),
                Communities.view_count.desc(),
                Communities.id.desc()
            )
        else:  # latest (기본값) 및 likes
            query = query.order_by(
                Communities.is_notice.desc(),
                Communities.pinned_at.desc(),
                Communities.id.desc()
            )

        # 페이징
        if effective_params.get("limit") is not None:
            query = query.limit(effective_params["limit"])

        return query.all()

    @staticmethod
    def get_community_count(session, user_id, params) -> int:
        """
        커뮤니티 목록 총 개수
        """
        effective_params = dict(params)
        effective_params["user_id"] = user_id

        # count 용도이므로 join 최소화 (user는 user_nickname 검색에 필요할 수 있어 포함)
        include = ["user"] if effective_params.get("user_nickname") else []

        query = CommunitiesRepository.build_base_query(session, effective_params, include)
        query = CommunitiesRepository.apply_filters(query, effective_params, include)

        return query.count()

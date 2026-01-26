
from app.models.users import Users
from app.models.communities import Community
from app.models.users_childs import UsersChilds
from app.schemas.common_schemas import CommonResponse
from app.models.communities_comments import CommunitiesComments
from app.core.config import settings

def get_community_list(db, user_hash, params) -> CommonResponse:
    """커뮤니티 리스트 조회 서비스 함수"""
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="유효하지 않은 사용자입니다.")

    # 파라미터 정리 (camelCase -> snake_case)
    db_params = {
        "category_code": params.get("category_code"),
        "is_notice": params.get("is_notice"),
        "is_secret": params.get("is_secret"),
        "keyword": params.get("keyword"),
        "month": params.get("month"),
        "start_date": params.get("start_date"),
        "end_date": params.get("end_date"),
        "user_nickname": params.get("user_nickname"),
        "sort_by": params.get("sort_by", "latest"),
        "cursor": params.get("cursor"),
        "my_only": params.get("my_only"),
        "limit": params.get("limit", 20),
    }


    community_list = [item._data for item in Community.get_list(db, user.id, db_params).serialize()]
    for community in community_list:
        community['profile_image'] = settings.BACKEND_SHOP_URL + community['profile_image'] if community.get('profile_image') else None

    total_count = Community.get_list_count(db, user.id, db_params)

    data = {
        "communities": community_list,
        "total_count": total_count,
        # cursor는 마지막 항목의 id를 반환
        # Community.id.desc() 기준으로 정렬되어 있다고 가정
        "cursor": community_list[-1]['id'] if community_list else None,
    }
    return CommonResponse(success=True, data=data)

def create_community(db, user_hash, client_ip, params) -> CommonResponse:
    """커뮤니티 글 작성 서비스 함수"""
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="유효하지 않은 사용자입니다.")

    try:
        params = {
            "title": params.title,
            "contents": params.contents,
            "category_code": params.category_code,
            "is_secret": params.is_secret,
            "user_id": user.id,
            "user_nickname": user.nickname,
            "user_ip": client_ip,
        }

        new_community = Community.create(db, params)

        user_child = UsersChilds.getAgentChild(db, user.id)

        return_data = {
            "title": new_community.title,
            "contents": new_community.contents,
            "category_code": new_community.category_code,
            "is_secret": new_community.is_secret,
            "user_hash": user.view_hash,
            "user_profile_image": settings.BACKEND_SHOP_URL + user.profile_image if user.profile_image else None,
            "user_nickname": new_community.user_nickname,
            "view_hash": new_community.view_hash,
            "user_child_name": user_child.child_name if user_child else None,
            "user_child_birth": user_child.child_birth.isoformat() if user_child and user_child.child_birth else None,
            "user_child_gender": user_child.child_gender if user_child else None,
            "created_at": new_community.created_at.isoformat() if new_community.created_at else None,
            "updated_at": new_community.updated_at.isoformat() if new_community.updated_at else None,
        }

    except Exception as e:
        return CommonResponse(success=False, message="커뮤니티 글 작성 중 오류가 발생했습니다." + str(e))

    return CommonResponse(success=True, message="커뮤니티 글이 성공적으로 작성되었습니다.", data=return_data)

def get_community_detail(db, user_hash, community_hash) -> CommonResponse:
    """커뮤니티 글 상세 조회 서비스 함수"""
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="유효하지 않은 사용자입니다.")

    community = Community.findByViewHash(db, community_hash)
    if not community:
        return CommonResponse(success=False, error="존재하지 않는 커뮤니티 글입니다.")

    if community.is_active != 'Y':
        return CommonResponse(success=False, error="삭제된 커뮤니티 글입니다.")

    try:
        # 조회수 증가
        community.view_count += 1
        db.commit()
        db.refresh(community)

        user_child = UsersChilds.getAgentChild(db, community.user_id)

        return_data = {
            "title": community.title,
            "contents": community.contents,
            "category_code": community.category_code,
            "is_secret": community.is_secret,
            "user_hash": user.view_hash,
            "user_profile_image": settings.BACKEND_SHOP_URL + user.profile_image if user.profile_image else None,
            "user_nickname": community.user_nickname,
            "view_hash": community.view_hash,
            "user_child_name": user_child.child_name if user_child else None,
            "user_child_birth": user_child.child_birth.isoformat() if user_child and user_child.child_birth else None,
            "user_child_gender": user_child.child_gender if user_child else None,
            "view_count": community.view_count,
            "created_at": community.created_at.isoformat() if community.created_at else None,
            "updated_at": community.updated_at.isoformat() if community.updated_at else None,
        }

    except Exception as e:
        return CommonResponse(success=False, error="커뮤니티 글 상세 조회 중 오류가 발생했습니다." + str(e))

    return CommonResponse(success=True, message="커뮤니티 글 상세 조회에 성공했습니다.", data=return_data)

def delete_community(db, user_hash, community_hash) -> CommonResponse:
    """커뮤니티 글 삭제 서비스 함수"""
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, error="유효하지 않은 사용자입니다.")

    community = Community.findByViewHash(db, community_hash)
    if not community:
        return CommonResponse(success=False, error="존재하지 않는 커뮤니티 글입니다.")

    if community.is_active != 'Y':
        return CommonResponse(success=False, error="이미 삭제된 커뮤니티 글입니다.")

    if community.user_id != user.id:
        return CommonResponse(success=False, error="본인이 작성한 글만 삭제할 수 있습니다.")

    try:
        result = Community.soft_delete(db, community)

        if not result:
            return CommonResponse(success=False, error="커뮤니티 글 삭제에 실패했습니다.")

        if result.is_active != 'N':
            return CommonResponse(success=False, error="커뮤니티 글 삭제에 실패했습니다.")

    except Exception as e:
        return CommonResponse(success=False, error="커뮤니티 글 삭제 중 오류가 발생했습니다." + str(e))

    return CommonResponse(success=True, message="커뮤니티 글이 성공적으로 삭제되었습니다.")

def update_community(db, user_hash, community_hash, params) -> CommonResponse:
    """커뮤니티 글 수정 서비스 함수"""
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="유효하지 않은 사용자입니다.")

    community = Community.findByViewHash(db, community_hash)
    if not community:
        return CommonResponse(success=False, message="존재하지 않는 커뮤니티 글입니다.")

    if community.is_active != 'Y':
        return CommonResponse(success=False, message="삭제된 커뮤니티 글입니다.")

    if community.user_id != user.id:
        return CommonResponse(success=False, message="본인이 작성한 글만 수정할 수 있습니다.")

    try:
        community.title = params.title
        community.contents = params.contents
        community.is_secret = params.is_secret

        db.commit()
        db.refresh(community)

        user_child = UsersChilds.getAgentChild(db, user.id)

        return_data = {
            "title": community.title,
            "contents": community.contents,
            "category_code": community.category_code,
            "is_secret": community.is_secret,
            "user_hash": user.view_hash,
            "user_profile_image": user.profile_image if user.profile_image else None,
            "user_nickname": community.user_nickname,
            "view_hash": community.view_hash,
            "user_child_name": user_child.child_name if user_child else None,
            "user_child_birth": user_child.child_birth.isoformat() if user_child and user_child.child_birth else None,
            "user_child_gender": user_child.child_gender if user_child else None,
            "created_at": community.created_at.isoformat() if community.created_at else None,
            "updated_at": community.updated_at.isoformat() if community.updated_at else None,
        }

    except Exception as e:
        return CommonResponse(success=False, message="커뮤니티 글 수정 중 오류가 발생했습니다." + str(e))

    return CommonResponse(success=True, message="커뮤니티 글이 성공적으로 수정되었습니다.", data=return_data)

def like_community(db, user_hash, community_hash) -> CommonResponse:
    """커뮤니티 글 좋아요 서비스 함수"""
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="유효하지 않은 사용자입니다.")

    community = Community.findByViewHash(db, community_hash)
    if not community:
        return CommonResponse(success=False, message="존재하지 않는 커뮤니티 글입니다.")

    if community.is_active != 'Y':
        return CommonResponse(success=False, message="삭제된 커뮤니티 글입니다.")

    try:
        # 좋아요 로직 구현 (예: CommunitiesLikes 모델 사용)
        from app.models.communities_likes import CommunitiesLikes

        existing_like = db.query(CommunitiesLikes).filter_by(community_id=community.id, user_id=user.id).first()

        # 이미 좋아요가 있다면 좋아요 차감
        if existing_like:

            db.delete(existing_like)
            # 좋아요 수 감소
            if community.like_count > 0:
                community.like_count -= 1
            else:
                community.like_count = 0
        else:

            CommunitiesLikes.create(db, community.id, user.id)
            # 좋아요 수 증가
            community.like_count += 1

        db.commit()
        db.refresh(community)

    except Exception as e:
        return CommonResponse(success=False, message="커뮤니티 글 좋아요 중 오류가 발생했습니다." + str(e))

    return CommonResponse(success=True, message="커뮤니티 글에 좋아요를 눌렀습니다.")

""" 커뮤니티 댓글 등록 서비스 함수 """
def create_community_comment(db, user_hash, community_hash, params) -> CommonResponse:
    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="유효하지 않은 사용자입니다.")

    community = Community.findByViewHash(db, community_hash)
    if not community:
        return CommonResponse(success=False, message="존재하지 않는 커뮤니티 글입니다.")

    if community.is_active != 'Y':
        return CommonResponse(success=False, message="삭제된 커뮤니티 글입니다.")

    try:
        # parent_hash가 있으면 parent_id 찾기
        parent_id = None
        if params.parent_hash:
            parent_comment = CommunitiesComments.findByViewHash(db, params.parent_hash)
            if parent_comment:
                parent_id = parent_comment.id

        comment_params = {
            "community_id": community.id,
            "user_id": user.id,
            "parent_id": parent_id,
            "comment": params.comment,
            "parent_hash": params.parent_hash if params.parent_hash else "",
        }

        new_comment = CommunitiesComments.create(db, comment_params)

        return_data = {
            "community_id": new_comment.community_id,
            "comment": new_comment.comment,
            "parent_id": new_comment.parent_id,
            "view_hash": new_comment.view_hash,
            "parent_hash": new_comment.parent_hash,
            "user_hash": user.view_hash,
            "user_nickname": user.nickname,
            "user_profile_image": settings.BACKEND_SHOP_URL + user.profile_image if user.profile_image else None,
            "created_at": new_comment.created_at.isoformat() if new_comment.created_at else None,
            "updated_at": new_comment.updated_at.isoformat() if new_comment.updated_at else None,
        }

    except Exception as e:
        return CommonResponse(success=False, message="커뮤니티 댓글 작성 중 오류가 발생했습니다." + str(e))

    return CommonResponse(success=True, message="커뮤니티 댓글이 성공적으로 작성되었습니다.", data=return_data)

"""커뮤니티 댓글 리스트 조회 서비스 함수"""
def get_community_comments(db, user_hash, params) -> CommonResponse:

    user = Users.findByViewHash(db, user_hash)
    if not user:
        return CommonResponse(success=False, message="유효하지 않은 사용자입니다.")

    community = Community.findByViewHash(db, params.get("community_hash"))
    if not community:
        return CommonResponse(success=False, message="존재하지 않는 커뮤니티 글입니다.")

    params = {
        "community_id": community.id,
    }
    extra = {
        "limit": params.get("limit", 100),
    }

    comment_list = CommunitiesComments.get_list(db, params, extra).getData()
    tree_data = CommunitiesComments.build_comment_tree(comment_list)

    data = {
        "comments": tree_data,
    }

    return CommonResponse(success=True, data=data)
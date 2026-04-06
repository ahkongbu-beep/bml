
from app.repository.communities_repository import CommunitiesRepository

from app.schemas.common_schemas import CommonResponse
from app.serializer.communities_comments_serialize import serialize_community_comment
from app.serializer.communities_serialize import build_community_detail_response, serialize_communities_list

from app.services.users_service import validate_user
from app.services.meals_comments_service import build_comment_tree
from app.services.users_childs_service import get_agent_childs
from app.services.communities_comments_service import sort_delete_comment, validate_comment_by_hash, update_community_comment, crreate_community_comment, get_community_comments_list
from app.services.attaches_files_service import soft_delete_file_by_model_id, upload_file, save_upload_file, get_attache_files_by_model_id

def validate_community_by_hash(db, community_hash):
    community = get_community_by_hash(db, community_hash)
    if not community:
        raise ValueError("존재하지 않는 커뮤니티 글입니다.")

    return community

def get_community_by_hash(db, community_hash):
    """커뮤니티 글 조회 서비스 함수"""
    community = CommunitiesRepository.find_by_view_hash(db, community_hash)
    if not community:
        return None

    return community

def validate_community_by_id(db, community_id):
    community = get_community_by_id(db, community_id)
    if not community:
        raise ValueError("존재하지 않는 커뮤니티 글입니다.")

    return community

def get_community_by_id(db, community_id):
    """커뮤니티 글 조회 서비스 함수"""
    community = CommunitiesRepository.get_community_by_id(db, community_id)
    if not community:
        return None

    return community._data

def get_parent_id_by_hash(db, parent_hash):
    parent_id = None

    if not parent_hash:
        return parent_id

    community = get_community_by_hash(db, parent_hash)
    if community:
        parent_id = community.id

    return parent_id

def increate_community_view_count(db, community):
    """커뮤니티 글 조회수 증가 서비스 함수"""
    CommunitiesRepository.increase_view_count(db, community, is_commit=False)

def get_community_list(db, user_hash, params) -> CommonResponse:
    """커뮤니티 리스트 조회 서비스 함수"""
    try:
        user = validate_user(db, user_hash)

        append_keys = [
            "category_code",
            "is_notice",
            "is_secret",
            "keyword",
            "month",
            "start_date",
            "end_date",
            "user_nickname",
            "sort_by",
            "my_only",
            "cursor",
            "limit"
        ]

        db_params = {}
        for key in append_keys:
            db_params[key] = params[key]

        community_list = CommunitiesRepository.get_community_list(db, user.id, db_params)
        communities = [item._data for item in serialize_communities_list(community_list)]

        total_count = CommunitiesRepository.get_community_count(db, user.id, db_params)

        return CommonResponse(
            success=True,
            data={
                "communities": communities,
                "total_count": total_count,
                "cursor": communities[-1]['id'] if communities else None,
            }
        )

    except Exception as e:
        return CommonResponse(success=False, message=str(e))


async def create_community(db, user_hash, client_ip, title, contents, category_code, is_secret, files) -> CommonResponse:
    try:
        user = validate_user(db, user_hash)

        # 커뮤니티 글 생성 (이미지 업로드는 이후 단계에서 처리)
        new_community = CommunitiesRepository.create(db, {
            "title": title,
            "contents": contents,
            "category_code": category_code,
            "is_secret": is_secret,
            "user_id": user.id,
            "user_nickname": user.nickname,
            "user_ip": client_ip,
        })

        # 이미지 업로드 처리 (최대 3장)
        if files and len(files) > 0:
            for idx, file in enumerate(files[:3]):  # 최대 3장
                if file and file.filename:
                    file_result = await upload_file(new_community.id, file, "Communities")
                    if file_result and "image_url" in file_result:
                        file_result["sort_order"] = idx  # sort_order 추가
                        # DB에 이미지 정보 저장
                        await save_upload_file(db, "Communities", new_community.id, file_result)

        return CommonResponse(success=True, message="커뮤니티 글이 성공적으로 작성되었습니다.", data=None)
    except Exception as e:
        return CommonResponse(success=False, message="커뮤니티 글 작성 중 오류가 발생했습니다." + str(e))


"""
커뮤니티 글 상세 조회 서비스 함수
"""
def get_community_detail(db, user_hash, community_hash) -> CommonResponse:
    try:
        user = validate_user(db, user_hash)
        community = validate_community_by_hash(db, community_hash)

        if community.is_active == 'N':
            raise ValueError("삭제된 커뮤니티 글입니다.")

        increate_community_view_count(db, community)

        db.commit()
        db.refresh(community)

        user_child = get_agent_childs(db, {"user_id": community.user_id})

        # 이미지 목록 조회
        images = [f.image_url for f in get_attache_files_by_model_id(db, "Communities", community.id)]

        return_data = build_community_detail_response(
            community,
            user,
            user_child,
            images
        )
        return CommonResponse(success=True, message="커뮤니티 글 상세 조회에 성공했습니다.", data=return_data)

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e))

def delete_community(db, user_hash, community_hash) -> CommonResponse:
    """커뮤니티 글 삭제 서비스 함수"""
    try:
        user = validate_user(db, user_hash)
        community = validate_community_by_hash(db, community_hash)

        if community.is_active != 'Y':
            raise ValueError("이미 삭제된 커뮤니티 글입니다.")

        if community.user_id != user.id:
            raise ValueError("본인이 작성한 글만 삭제할 수 있습니다.")

        result = CommunitiesRepository.soft_delete(db, community)
        db.commit()

        if not result:
            raise ValueError("커뮤니티 글 삭제에 실패했습니다.")

        if result.is_active != 'N':
            raise ValueError("커뮤니티 글 삭제에 실패했습니다.")

    except ValueError as ve:
        db.rollback()
        return CommonResponse(success=False, error=str(ve))

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, error=str(e))

    return CommonResponse(success=True, message="커뮤니티 글이 성공적으로 삭제되었습니다.")

"""
커뮤니티 글 수정 서비스 함수
"""
async def update_community(db, user_hash, community_hash, title, contents, is_secret, files) -> CommonResponse:

    try:
        user = validate_user(db, user_hash)
        community = validate_community_by_hash(db, community_hash)

        if community.is_active != 'Y':
            return CommonResponse(success=False, message="삭제된 커뮤니티 글입니다.")

        if community.user_id != user.id:
            return CommonResponse(success=False, message="본인이 작성한 글만 수정할 수 있습니다.")

        # 기존 이미지 모두 삭제
        soft_delete_file_by_model_id(db, "Communities", community.id)

        # 새 이미지 업로드 (최대 3장)
        if files and len(files) > 0:
            for idx, file in enumerate(files[:3]):  # 최대 3장
                if file and file.filename:
                    file_result = await upload_file(community.id, file, "Communities")
                    if file_result and "image_url" in file_result:
                        file_result["sort_order"] = idx  # sort_order 추가
                        # DB에 이미지 정보 저장
                        await save_upload_file(db, "Communities", community.id, file_result)

        community.title = title
        community.contents = contents
        community.is_secret = is_secret

        db.commit()
        return CommonResponse(success=True, message="커뮤니티 글이 성공적으로 수정되었습니다.", data=None)
    except Exception as e:
        return CommonResponse(success=False, message="커뮤니티 글 수정 중 오류가 발생했습니다." + str(e))



"""
커뮤니티 글 좋아요 서비스 함수
"""
def like_community(db, user_hash, community_hash) -> CommonResponse:

    try:
        user = validate_user(db, user_hash)
        community = validate_community_by_hash(db, community_hash)

        if community.is_active != 'Y':
            raise ValueError("삭제된 커뮤니티 글입니다.")

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
        return CommonResponse(success=False, message=str(e))

    return CommonResponse(success=True, message="커뮤니티 글에 좋아요를 눌렀습니다.")

def create_community_comment(db, user_hash, community_hash, params) -> CommonResponse:
    """
    커뮤니티 댓글 등록 서비스 함수
    """
    try:
        user = validate_user(db, user_hash)
        community = validate_community_by_id(db, community_hash)

        if community.is_active != 'Y':
            raise ValueError("삭제된 커뮤니티 글입니다.")

    except Exception as e:
        return CommonResponse(success=False, message=str(e))

    try:
        # parent_hash가 있으면 parent_id 찾기
        parent_hash = params.parent_hash if params.parent_hash else None
        parent_id = get_parent_id_by_hash(db, parent_hash)

        params = {
            "community_id": community.id,
            "user_id": user.id,
            "parent_id": parent_id,
            "comment": params.comment,
            "parent_hash": parent_hash,
        }

        new_comment = crreate_community_comment(db, params, is_commit=False)

        if new_comment is None:
            raise ValueError("커뮤니티 댓글 생성에 실패했습니다.")

        db.commit()
        db.refresh(new_comment)

    except Exception as e:
        return CommonResponse(success=False, message="커뮤니티 댓글 작성 중 오류가 발생했습니다." + str(e))

    return CommonResponse(success=True, message="커뮤니티 댓글이 성공적으로 작성되었습니다.", data=None)

def delete_community_comment(db, user_hash, comment_hash) -> CommonResponse:
    """
    커뮤니티 댓글 삭제 서비스 함수
    """
    try:
        user = validate_user(db, user_hash)
        comment = validate_comment_by_hash(db, comment_hash)

        if comment.user_id != user.id:
            return CommonResponse(success=False, message="본인이 작성한 댓글만 삭제할 수 있습니다.")

        # 댓글 삭제처리 (soft delete)
        success_bool = sort_delete_comment(db, comment)

        if not success_bool:
            raise ValueError("커뮤니티 댓글 삭제에 실패했습니다.")

        return CommonResponse(success=True, message="커뮤니티 댓글이 성공적으로 삭제되었습니다.")

    except Exception as e:
        return CommonResponse(success=False, message="커뮤니티 댓글 삭제 중 오류가 발생했습니다." + str(e))


def update_community_comment(db, user_hash, comment_hash, params) -> CommonResponse:
    """
    커뮤니티 댓글 수정 서비스 함수
    """
    try:
        user = validate_user(db, user_hash)
        comment = validate_comment_by_hash(db, comment_hash)

        if comment.user_id != user.id:
            raise ValueError("본인이 작성한 댓글만 수정할 수 있습니다.")

        # 댓글 수정처리
        update_community_comment(db, comment, params.comment, is_commit=False)
        db.commit()
        db.refresh(comment)
    except Exception as e:
        return CommonResponse(success=False, message=str(e))

    return CommonResponse(success=True, message="커뮤니티 댓글이 성공적으로 수정되었습니다.")

def get_community_comments(db, user_hash, params) -> CommonResponse:
    """
    커뮤니티 댓글 리스트 조회 서비스 함수
    """
    try:
        validate_user(db, user_hash)
        community = validate_community_by_hash(db, params.get("community_hash"))

        params = {
            "community_id": community.id,
        }

        extra = {
            "limit": params.get("limit", 100),
        }

        comment_list = serialize_community_comment(get_community_comments_list(db, params, extra))
        tree_data = build_comment_tree(comment_list)

        return CommonResponse(success=True, data={
            "comments": tree_data,
        })
    except Exception as e:
        return CommonResponse(success=False, message=str(e))






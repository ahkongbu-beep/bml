class CommunityData:
    def __init__(self, data: dict):
        self._data = data


def serialize_community(community) -> CommunityData:
    # images: DB에서 group_concat 으로 ","로 연결된 문자열 → 리스트로 변환
    images = community.images.split(",") if community.images else []

    return CommunityData({
        "id": community.id,
        "view_hash": community.view_hash,
        "category_code": community.category_code,
        "user_id": community.user_id,
        "title": community.title,
        "contents": community.contents,
        "user_nickname": community.user_nickname,
        "like_count": community.like_count,
        "view_count": community.view_count,
        "comment_count": community.comment_count,
        "is_secret": community.is_secret,
        "is_active": community.is_active,
        "is_notice": community.is_notice,
        "is_liked": community.is_liked,
        "created_at": str(community.created_at) if community.created_at else None,
        "updated_at": str(community.updated_at) if community.updated_at else None,
        "pinned_at": str(community.pinned_at) if community.pinned_at else None,
        "images": images,
        "user": {
            "nickname": community.nickname,
            "profile_image": community.profile_image,
            "user_hash": community.user_hash,
        },
        "child": {
            "child_name": community.child_name,
            "child_birth": str(community.child_birth) if community.child_birth else None,
            "child_gender": community.child_gender,
        } if community.child_name else None,
    })

def build_community_detail_response(community, user, child, images):
    return {
        "title": community.title,
        "contents": community.contents,
        "category_code": community.category_code,
        "is_secret": community.is_secret,
        "images": images,
        "user_hash": user.view_hash,
        "user_profile_image": user.profile_image,
        "user_nickname": community.user_nickname,
        "view_hash": community.view_hash,
        "user_child_name": child.child_name if child else None,
        "user_child_birth": child.child_birth.isoformat() if child and child.child_birth else None,
        "user_child_gender": child.child_gender if child else None,
        "view_count": community.view_count,
        "created_at": community.created_at.isoformat() if community.created_at else None,
        "updated_at": community.updated_at.isoformat() if community.updated_at else None,
    }

def serialize_communities_list(community_list):
    return [serialize_community(community) for community in community_list]
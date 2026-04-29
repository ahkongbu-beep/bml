class CommunityCommentData:
    def __init__(self, data: dict):
        self._data = data
        self.children = []

    def __getattr__(self, name):
        try:
            return self._data[name]
        except KeyError:
            raise AttributeError(f"'CommunityCommentData' object has no attribute '{name}'")

    def to_dict(self) -> dict:
        result = dict(self._data)
        result["children"] = [c.to_dict() for c in self.children]
        return result

def serialize_community_comment(comment) -> CommunityCommentData:
    return CommunityCommentData({
        "community_id": comment.community_id,
        "comment": comment.comment,
        "parent_id": comment.parent_id,
        "is_owner": comment.is_owner,
        "created_at": str(comment.created_at) if comment.created_at else None,
        "updated_at": str(comment.updated_at) if comment.updated_at else None,
        "deleted_at": str(comment.deleted_at) if comment.deleted_at else None,
        "view_hash": comment.view_hash,
        "parent_hash": comment.parent_hash,
        "user": {
            "nickname": comment.nickname,
            "profile_image": comment.profile_image if comment.profile_image else None,
            "user_hash": comment.user_hash
        }
    })
from app.repository.communities_comments_repository import CommunitiesCommentsRepository

def validate_comment_by_hash(db, comment_hash: str):
    comment = get_comment_by_hash(db, comment_hash)
    if not comment:
        raise ValueError("존재하지 않는 댓글입니다.")
    return comment

def get_comment_by_hash(db, comment_hash: str):
    return CommunitiesCommentsRepository.find_by_view_hash(db, comment_hash)

def sort_delete_comment(db, comment):
    if not comment:
        raise ValueError("존재하지 않는 댓글입니다.")

    success_bool = CommunitiesCommentsRepository.soft_delete(db, comment)
    if not success_bool:
        raise ValueError("댓글 삭제에 실패했습니다.")

    return True

def get_community_comments_list(db, params: dict, extra: dict = None):
    comment_list = CommunitiesCommentsRepository.get_list(db, params, extra)
    return comment_list

def crreate_community_comment(db, params: dict, is_commit: bool = True):

    return CommunitiesCommentsRepository.create(db, params, is_commit=is_commit)

def update_community_comment(db, comment, contents, is_commit: bool = True):

    CommunitiesCommentsRepository.update(db, comment, {
        "comment": contents
    }, is_commit=is_commit)

    return True
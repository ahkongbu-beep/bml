from app.repository.meals_comments_repository import MealsCommentsRepository

"""댓글 트리 구조 생성 - Pydantic 모델용"""
def build_comment_tree(comments):
    comment_dict = {comment.view_hash: comment for comment in comments}
    root_comments = []

    for comment in comments:
        if comment.parent_hash:
            parent_comment = comment_dict.get(comment.parent_hash)
            if parent_comment:
                # Pydantic 모델의 children 리스트에 추가
                parent_comment.children.append(comment)
        else:
            root_comments.append(comment)

    return root_comments

"""
식단 해시로 댓글 조회
"""
def get_meal_comments_by_hash(db, meal_hash: str):
    comments = MealsCommentsRepository.get_comment_by_view_hash(db, meal_hash)
    return build_comment_tree(comments)

"""
댓글 생성
"""
def create_meal_comment(db, params: dict):
    new_comment = MealsCommentsRepository.create(db, params)

    if not new_comment:
        raise Exception("댓글 생성에 실패했습니다.")

    return new_comment

"""
댓글 삭제
"""
def delete_meal_comment(db, comment, user_id: int):
    if not comment:
        raise Exception("존재하지 않는 댓글입니다.")

    if comment.user_id != user_id:
        raise Exception("댓글 삭제 권한이 없습니다.")

    if not MealsCommentsRepository.soft_delete(db, comment):
        raise Exception("댓글 삭제에 실패했습니다.")
"""
댓글 리스트
"""
def get_comment_list_by_user_meal_id(db, params, extra):
    result = MealsCommentsRepository.get_list(db, params, extra)
    return get_comment_list_by_user_meal_id_data(result)

"""
댓글 리스트 데이터 변환
"""
def get_comment_list_by_user_meal_id_data(result):
    from app.schemas.feeds_schemas import FeedsCommentResponse, FeedsUserResponse

    return [
        FeedsCommentResponse(
            meal_id=v.meal_id,
            comment=v.comment,
            parent_id=v.parent_id,
            is_owner=v.is_owner,
            created_at=v.created_at,
            updated_at=v.updated_at,
            deleted_at=v.deleted_at,
            view_hash=v.view_hash,
            parent_hash=v.parent_hash,
            user=FeedsUserResponse(
                id=v.user_id if hasattr(v, 'user_id') else None,
                nickname=v.nickname,
                profile_image=v.profile_image,
                user_hash=v.user_hash
            )
        )
        for v in result
    ]
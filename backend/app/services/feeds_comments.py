
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
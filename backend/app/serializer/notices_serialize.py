
from app.schemas.notices_schemas import NoticesResponse

def serialize_notice(notice, category_text: str = None) -> NoticesResponse:
    return NoticesResponse(
        id=notice.id,
        title=notice.title,
        content=notice.content,
        status=notice.status,
        admin_name="관리자",  # TODO: Admin 테이블 JOIN
        created_at=notice.created_at,
        updated_at=notice.updated_at,
        ip=notice.ip,
        is_important=notice.is_important,
        category_text=category_text if category_text is not None else getattr(notice, 'category_text', None),
        view_hash=notice.view_hash
    )
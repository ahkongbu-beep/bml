from app.repository.notices_repository import NoticesRepository
from app.services.categories_codes_service import get_category_code_by_id
from app.schemas.notices_schemas import NoticesCreateRequest, NoticesDetailResponseData, NoticesUpdateRequest
from app.schemas.common_schemas import CommonResponse

def get_notice_by_view_hash(db, view_hash: str):
    notice = NoticesRepository.find_by_view_hash(db, view_hash)
    return notice

def get_notice_list(db, params = {}):
    notice_list = NoticesRepository.get_list(db, params=params)
    return notice_list

def get_notice_count(db, params = {}):
    notice_count = NoticesRepository.get_count(db, params=params)
    return notice_count

def list_notices(db, params = {}):
    notice_list = get_notice_list(db, params=params)
    return CommonResponse(success=True, message="", data=notice_list)

def notice_detail(db, view_hash: str):
    notice = get_notice_by_view_hash(db, view_hash)

    if not notice:
        return CommonResponse(success=False, error="존재하지 않는 공지사항입니다.", data=None)

    category_code = get_category_code_by_id(db, notice.category_id)

    data = NoticesDetailResponseData(
        view_hash=notice.view_hash,
        category_id=notice.category_id,
        category_text=category_code.value,
        title=notice.title,
        content=notice.content,
        is_important=notice.is_important,
        status=notice.status,
        created_at=notice.created_at,
        updated_at=notice.updated_at,
        admin_name="관리자"
    )

    return CommonResponse(success=True, message="", data=data)

# 공지 등록
def create_notice(notice: NoticesCreateRequest, client_ip: str, db):

    category_code = get_category_code_by_id(db, notice.category_id)
    if not category_code or category_code.type != "NOTICES_GROUP":
        return CommonResponse(success=False, error="유효하지 않은 카테고리입니다.", data=None)

    params = {
        "admin_id": 1,  # Placeholder for actual admin ID
        "category_id": category_code.id,
        "title": notice.title,
        "content": notice.content,
        "is_important": notice.is_important,
        "status": notice.status,
        "ip": client_ip
    }

    new_notice = NoticesRepository.create(db, params)

    if not new_notice:
        return None

    return new_notice

""" 공지 수정"""
def update_notice(notice: NoticesUpdateRequest, view_hash: str, db):

    existing_notice = NoticesRepository.find_by_view_hash(db, view_hash)

    if not existing_notice:
        return CommonResponse(success=False, error="존재하지 않는 공지사항입니다.", data=None)

    category_code = get_category_code_by_id(db, notice.category_id)

    if not category_code or category_code.type != "NOTICES_GROUP":
        return CommonResponse(success=False, error="유효하지 않은 카테고리입니다.", data=None)

    params = {
        "category_id": category_code.id,
        "title": notice.title,
        "content": notice.content,
        "is_important": notice.is_important,
        "client_id": notice.client_id
    }

    try:
        updated_notice = NoticesRepository.update(db, existing_notice, params)

        if not updated_notice:
            raise Exception("공지사항 수정에 실패했습니다.")
    except Exception as e:
        return None

    return updated_notice

def toggle_notice(notice: str, db):

    try:
        if notice.status == "active":
            notice.status = "unactive"
        else:
            notice.status = "active"
        db.commit()
    except Exception as e:
        db.rollback()
        return False

    return True
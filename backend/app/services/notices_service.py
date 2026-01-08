from app.models.notices import Notices
from app.schemas.notices_schemas import NoticesCreateRequest, NoticesUpdateRequest
from app.models.categories_codes import CategoriesCodes
from app.schemas.common_schemas import CommonResponse

def list_notices(db):
    notice_list = Notices.getList(db, params={}).getData()
    return CommonResponse(success=True, message="", data=notice_list)

def notice_detail(db, view_hash: str):
    notice = Notices.findByViewHash(db, view_hash)

    if not notice:
        return CommonResponse(success=False, error="존재하지 않는 공지사항입니다.", data=None)

    category_code = CategoriesCodes.findById(db, notice.category_id)

    data = {
        "view_hash": notice.view_hash,
        "category_id": notice.category_id,
        "category_text": category_code.value,
        "title": notice.title,
        "content": notice.content,
        "is_important": notice.is_important,
        "status": notice.status,
        "created_at": notice.created_at,
        "updated_at": notice.updated_at,
        "admin_name": "관리자"
    }

    return CommonResponse(success=True, message="", data=data)

# 공지 등록
def create_notice(notice: NoticesCreateRequest, client_ip: str, db):

    params = {
        "admin_id": 1,  # Placeholder for actual admin ID
        "category_id": notice.category_id,
        "title": notice.title,
        "content": notice.content,
        "is_important": notice.is_important,
        "status": notice.status,
        "ip": client_ip
    }

    try:
        new_notice = Notices.create(db, params)

        if not new_notice:
            raise Exception("공지사항 등록 실패했습니다.")
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)

    category_code = CategoriesCodes.findById(db, notice.category_id)

    data = {
        "id": new_notice.id,
        "view_hash": new_notice.view_hash,
        "category_id": new_notice.category_id,
        "category_text": category_code.value,
        "title": new_notice.title,
        "content": new_notice.content,
        "ip": new_notice.ip,
        "is_important": new_notice.is_important,
        "status": new_notice.status,
        "created_at": new_notice.created_at,
        "updated_at": new_notice.updated_at,
    }

    return CommonResponse(success=True, message="", data=data)

""" 공지 수정"""
def update_notice(notice: NoticesUpdateRequest, view_hash: str, db):

    existing_notice = Notices.findByViewHash(db, view_hash)

    if not existing_notice:
        return CommonResponse(success=False, error="존재하지 않는 공지사항입니다.", data=None)

    category_code = CategoriesCodes.findById(db, notice.category_id)

    if not category_code:
        return CommonResponse(success=False, error="유효하지 않은 카테고리입니다.", data=None)

    params = {
        "category_id": category_code.id,
        "title": notice.title,
        "content": notice.content,
        "is_important": notice.is_important,
    }

    try:
        updated_notice = Notices.update(db, existing_notice, params)

        if not updated_notice:
            raise Exception("공지사항 수정에 실패했습니다.")
    except Exception as e:
        return CommonResponse(success=False, error=str(e), data=None)


    data = {
        "id": updated_notice.id,
        "view_hash": updated_notice.view_hash,
        "category_id": updated_notice.category_id,
        "category_text": category_code.value,
        "title": updated_notice.title,
        "content": updated_notice.content,
        "ip": updated_notice.ip,
        "is_important": updated_notice.is_important,
        "status": updated_notice.status,
        "created_at": updated_notice.created_at,
        "updated_at": updated_notice.updated_at,
    }

    return CommonResponse(success=True, message="공지 수정완료하였습니다.", data=data)

def toggle_notice(view_hash: str, db):

    existing_notice = Notices.findByViewHash(db, view_hash)

    if not existing_notice:
        return CommonResponse(success=False, error="존재하지 않는 공지사항입니다.", data=None)

    try:
        if existing_notice.status == "active":
            existing_notice.status = "unactive"
        else:
            existing_notice.status = "active"
        db.commit()
    except Exception as e:
        return CommonResponse(success=False, error="공지사항 삭제에 실패했습니다.", data=None)

    return CommonResponse(success=True, message="공지사항 상태가 변경되었습니다.", data=None)
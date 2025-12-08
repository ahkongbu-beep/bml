from app.models.notices import Notices
from app.schemas.notices_schemas import NoticesCreateRequest
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
        "is_important": 'Y' if notice.is_important else 'N',
        "status": notice.status,
        "ip": client_ip
    }

    try:
        new_notice = Notices.create(db, params)

        if not new_notice:
            raise Exception("공지사항 등록 실패했습니다.")
    except Exception as e:
        raise e


    return new_notice

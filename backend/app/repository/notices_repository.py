from app.models.notices import Notices
import hashlib
import pytz
from datetime import datetime

from app.models.categories_codes import CategoriesCodes

class NoticesRepository:

    @staticmethod
    def findById(session, notice_id: int):
        return session.query(Notices).filter(
            Notices.id == notice_id,
            Notices.status == 'active'
        ).first()

    @staticmethod
    def find_by_view_hash(session, view_hash: str):
        return session.query(Notices).filter(
            Notices.view_hash == view_hash,
        ).first()

    @staticmethod
    def create(session, params: dict):

        kst = pytz.timezone("Asia/Seoul")

        title = params.get("title", "")
        content = params.get("content", "")
        created_at = datetime.now(kst)
        updated_at = datetime.now(kst)

        view_hash = hashlib.sha256(f"{title}-{content}-{created_at}".encode('utf-8')).hexdigest()

        notice = Notices(
            admin_id=params.get("admin_id", 0),
            category_id=params.get("category_id", 0),
            title=title,
            content=content,
            created_at=created_at,
            updated_at=updated_at,
            view_hash=view_hash,
            is_important=params.get("is_important", 'N'),
            status=params.get("status", 'active'),
            ip=params.get("ip", "")
        )

        session.add(notice)
        session.commit()
        session.refresh(notice)
        return notice

    @staticmethod
    def update(session, existing_notice, params: dict):

        if not existing_notice:
            return None

        for key, value in params.items():
            setattr(existing_notice, key, value)

        existing_notice.updated_at = datetime.now()

        session.commit()
        session.refresh(existing_notice)
        return existing_notice

    @staticmethod
    def get_list(session, params: dict):

        query = (
            session.query(
                Notices,
                CategoriesCodes.value.label("category_text")
            )
            .join(CategoriesCodes, Notices.category_id == CategoriesCodes.id)
        )

        if 'status' in params and params['status']:
            query = query.filter(Notices.status == params['status'])

        if 'created_start_at' in params and 'created_end_at' in params:
            query = query.filter(Notices.created_at >= params['created_start_at'] + ' 00:00:00')
            query = query.filter(Notices.created_at <= params['created_end_at'] + ' 23:59:59')

        if 'title' in params and params['title']:
            query = query.filter(Notices.title.like(f"%{params['title']}%"))

        if 'category_id' in params and params['category_id']:
            query = query.filter(Notices.category_id == params['category_id'])

        results = query.order_by(
            Notices.is_important.asc(),
            Notices.created_at.desc()
        ).all()

        # NoticesQueryResult 래퍼 객체 반환 (체이닝 가능)
        return NoticesQueryResult(results)


class NoticesQueryResult:
    """쿼리 결과를 감싸는 래퍼 클래스 - 체이닝 패턴 지원"""

    def __init__(self, results):
        self._results = results

    def getData(self):
        """직렬화된 Pydantic 모델 리스트 반환"""
        from app.schemas.notices_schemas import NoticesResponse

        return [
            NoticesResponse(
                title=notice.title,
                content=notice.content,
                status=notice.status,
                admin_name="관리자",  # TODO: Admin 테이블 JOIN
                created_at=notice.created_at,
                updated_at=notice.updated_at,
                ip=notice.ip,
                is_important=notice.is_important,
                category_text=category_text,
                view_hash=notice.view_hash
            )
            for notice, category_text in self._results
        ]

    def toDict(self):
        """딕셔너리 리스트 반환"""
        return [
            {
                "id": notice.id,
                "title": notice.title,
                "content": notice.content,
                "status": notice.status,
                "admin_name": "관리자",  # TODO: Admin 테이블 JOIN
                "created_at": notice.created_at.isoformat() if notice.created_at else None,
                "updated_at": notice.updated_at.isoformat() if notice.updated_at else None,
                "ip": notice.ip,
                "is_important": notice.is_important,
                "category_text": f"Category {notice.category_id}",  # TODO: Category 테이블 JOIN
                "view_hash": notice.view_hash
            }
            for notice in self._results
        ]

    def toJSON(self):
        """JSON 문자열 반환"""
        import json
        return json.dumps(self.toDict(), ensure_ascii=False, default=str)

    def getRawData(self):
        """원본 SQLAlchemy 객체 반환"""
        return self._results
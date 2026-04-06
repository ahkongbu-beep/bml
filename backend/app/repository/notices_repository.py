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
    def get_count(session, params: dict):
        query = session.query(Notices)

        if 'status' in params and params['status']:
            query = query.filter(Notices.status == params['status'])

        if 'created_start_at' in params and 'created_end_at' in params:
            query = query.filter(Notices.created_at >= params['created_start_at'] + ' 00:00:00')
            query = query.filter(Notices.created_at <= params['created_end_at'] + ' 23:59:59')

        if 'title' in params and params['title']:
            query = query.filter(Notices.title.like(f"%{params['title']}%"))

        if 'category_id' in params and params['category_id']:
            query = query.filter(Notices.category_id == params['category_id'])

        return query.count()

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

        if 'order_by' in params and params['order_by']:
            order_by_field = getattr(Notices, params['order_by'], None)
            if order_by_field is not None:
                if 'order_direction' in params and params['order_direction'] == 'desc':
                    query = query.order_by(order_by_field.desc())
                else:
                    query = query.order_by(order_by_field.asc())
        else:
            query = query.order_by(Notices.id.desc())

        if 'offset' in params and 'limit' in params:
            query = query.offset(params['offset']).limit(params['limit'])

        return query.all()


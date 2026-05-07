from app.models.advertiser import Advertiser
from sqlalchemy import func

class AdvertiserRepository:

    @staticmethod
    def get_advertiser_by_hash(session, view_hash):
        """
        광고주 해시로 조회
        """
        return session.query(Advertiser).filter(Advertiser.view_hash == view_hash).first()

    @staticmethod
    def apply_filters(query, params):
        """
        광고주 리스트 조회를 위한 필터 적용
        """

        def get_value(key, default=None):
            if isinstance(params, dict):
                return params.get(key, default)
            return getattr(params, key, default)

        def eq(col, key):
            val = get_value(key)
            if val in [None, "", 0]:
                return None
            return col == val

        conditions = [
            eq(Advertiser.account_id, "account_id"),
            eq(Advertiser.is_active, "is_active"),
        ]

        conditions = [condition for condition in conditions if condition is not None]

        # 날짜
        created_at_start = get_value("created_at_start")
        created_at_end = get_value("created_at_end")
        if created_at_start and created_at_end:
            conditions.append(
                Advertiser.created_at.between(
                    created_at_start,
                    created_at_end
                )
            )

        if conditions:
            query = query.filter(*conditions)
        return query

    @staticmethod
    def get_advertiser_list(session, params):
        """
        광고주 리스트 조회
        """
        from app.models.ads import Ads

        query = session.query(
            Advertiser,
            func.coalesce(func.sum(Ads.amount), 0).label("total_ad_amount")
        )
        query = query.join(
            Ads,
            Advertiser.id == Ads.advertiser_id,
            isouter=True
        )

        query = AdvertiserRepository.apply_filters(query, params)
        query = query.group_by(Advertiser.id)
        query = query.order_by(Advertiser.created_at.desc())

        if isinstance(params, dict):
            page = params.get("page", 1)
            page_size = params.get("page_size", 50)
        else:
            page = getattr(params, "page", 1)
            page_size = getattr(params, "page_size", 50)

        query = query.offset((page - 1) * page_size).limit(page_size)
        return query.all()

    @staticmethod
    def add(session, params):
        """
        광고주 추가
        """
        params['is_active'] = 'Y'
        new_advertiser = Advertiser(**params)
        session.add(new_advertiser)
        session.flush()
        session.refresh(new_advertiser)
        return new_advertiser

    @staticmethod
    def modify(session, advertiser_id, params):
        """
        광고주 수정
        """
        advertiser = session.query(Advertiser).filter(Advertiser.id == advertiser_id).first()
        if not advertiser:
            return None

        for key, value in params.items():
            setattr(advertiser, key, value)

        session.flush()
        session.refresh(advertiser)
        return advertiser
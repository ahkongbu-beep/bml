from app.models.ads import Ads
from sqlalchemy import func
from app.models.advertiser import Advertiser
from app.models.attaches_files import AttachesFiles

class AdsRepository:

    @staticmethod
    def get_ad_by_hash(session, view_hash):
        return session.query(Ads).filter(Ads.view_hash == view_hash).first()

    @staticmethod
    def get_total_amount_by_advertiser_id(session, advertiser_id):
        """
        광고주 ID로 광고 총액 조회
        """
        total_amount = session.query(func.sum(Ads.amount)).filter(Ads.advertiser_id == advertiser_id).scalar()
        return total_amount

    @staticmethod
    def set_click_count(session, ad_id, click_count):
        """
        광고 클릭 수 업데이트
        """
        ad = session.query(Ads).filter(Ads.id == ad_id).first()
        if ad:
            ad.click_count = click_count
            session.flush()
            session.refresh(ad)
            return ad
        return None

    @staticmethod
    def get_ads_list(session, params):
        """
        광고 리스트 조회
        """
        ad_images_subquery = session.query(
            AttachesFiles.img_model_id.label("ad_id"),
            func.group_concat(AttachesFiles.image_url).label("ad_images")
        ).filter(
            AttachesFiles.img_model == "Ads",
            AttachesFiles.is_active == "Y"
        ).group_by(
            AttachesFiles.img_model_id
        ).subquery()

        query = session.query(
            Ads,
            Advertiser.account_image,
            Advertiser.account_name,
            Advertiser.company,
            Advertiser.view_hash.label("advertiser_view_hash"),
            Advertiser.account_id,
            ad_images_subquery.c.ad_images
        ).join(
            Advertiser,
            Advertiser.id == Ads.advertiser_id,
            isouter=True
        ).join(
            ad_images_subquery,
            ad_images_subquery.c.ad_id == Ads.id,
            isouter=True
        )

        def _get(key, default=None):
            if isinstance(params, dict):
                return params.get(key, default)
            return getattr(params, key, default)

        if _get("advertiser_id"):
            query = query.filter(Ads.advertiser_id == _get("advertiser_id"))

        if _get("start_date") and _get("end_date"):
            query = query.filter(Ads.created_at.between(_get("start_date"), _get("end_date")))

        if _get("period_date"):
            query = query.filter(
                Ads.start_date <= _get("period_date"),
                Ads.end_date >= _get("period_date")
            )

        page = int(_get("page", 1))
        page_size = int(_get("page_size", 20))

        total_count = query.count()
        ads_list = query.order_by(Ads.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

        return ads_list, total_count

    @staticmethod
    def add(db, params):
        """
        광고 추가
        """
        params['is_active'] = 'Y'
        new_ad = Ads(**params)
        db.add(new_ad)
        db.flush()
        db.refresh(new_ad)
        return new_ad

    @staticmethod
    def modify(db, ad_id, params):
        """
        광고 수정
        """
        ad = db.query(Ads).filter(Ads.id == ad_id).first()
        if not ad:
            return None

        for key, value in params.items():
            setattr(ad, key, value)

        db.flush()
        db.refresh(ad)
        return ad
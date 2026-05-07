from app.models.ads import Ads
from sqlalchemy import func
from app.models.ad_clicks_logs import AdsClickLog

class AdsClicksLogsRepository:

    @staticmethod
    def add_log(session, ads_id, user_id, ip, user_agent):
        """
        광고 클릭 로그 생성
        """
        click_log = AdsClickLog(
            ads_id=ads_id,
            user_id=user_id,
            ip=ip,
            user_agent=user_agent
        )
        session.add(click_log)
        session.flush()
        session.refresh(click_log)
        return click_log
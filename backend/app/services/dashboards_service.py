from app.models.feeds import Feeds
from app.models.users import Users
from app.models.notices import Notices
from app.schemas.common_schemas import CommonResponse
from datetime import datetime
import pytz

def init_stat(db) -> CommonResponse:
    """대시보드 초기 통계 정보 조회 서비스 함수"""
    total_users = db.query(Users).count()
    total_feeds = db.query(Feeds).count()

    tz = pytz.timezone("Asia/Seoul")
    now = datetime.now(tz)
    # 마지막으로 등록된 피드의 등록시간을 현재 시간에서 빼기
    last_feed = db.query(Feeds).order_by(Feeds.created_at.desc()).first()
    if last_feed:
        created_at = last_feed.created_at

        # created_at이 naive일 경우 보정
        if created_at.tzinfo is None:
            created_at = tz.localize(created_at)
        else:
            created_at = created_at.astimezone(tz)

        last_regist_feed_time = time_ago(now - created_at)
    else:
        last_regist_feed_time = None

    last_user = db.query(Users).order_by(Users.created_at.desc()).first()
    if last_user:
        created_at = last_user.created_at

        # created_at이 naive일 경우 보정
        if created_at.tzinfo is None:
            created_at = tz.localize(created_at)
        else:
            created_at = created_at.astimezone(tz)

        last_regist_user_time = time_ago(now - created_at)

    last_notice = db.query(Notices).order_by(Notices.created_at.desc()).first()
    if last_notice:
        created_at = last_notice.created_at

        # created_at이 naive일 경우 보정
        if created_at.tzinfo is None:
            created_at = tz.localize(created_at)
        else:
            created_at = created_at.astimezone(tz)

        last_regist_notice_time = time_ago(now - created_at)
    else:
        last_regist_notice_time = None

    data = {
        "total_users": total_users,
        "total_feeds": total_feeds,
        "total_hotdeals": 23,  # 예시 값, 실제로는 핫딜 모델에서 카운트해야 함
        "last_regist_feed_time": str(last_regist_feed_time) if last_regist_feed_time else "데이터 없음",
        "last_regist_user_time": str(last_regist_user_time) if last_regist_user_time else "데이터 없음",
        "last_regist_notice_time": str(last_regist_notice_time) if last_regist_notice_time else "데이터 없음",
    }

    return CommonResponse(success=True, message="대시보드 초기 통계 정보 조회 성공", data=data)

def time_ago(delta):
    seconds = int(delta.total_seconds())

    if seconds < 60:
        return "방금 전"
    elif seconds < 3600:
        return f"{seconds // 60}분 전"
    elif seconds < 86400:
        return f"{seconds // 3600}시간 전"
    else:
        return f"{seconds // 86400}일 전"
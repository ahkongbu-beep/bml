# scripts/send_user_noti_week.py
"""
마지막 로그인 시간이 1주 또는 한달 이상인 사용자에게 식단 등록 알림을 보내는 배치 스크립트입니다.
- 마지막 로그인 시간 + 7일 또는 30일 이상인 사용자에게 FCM 푸시 알림을 전송합니다.
- 특정 요일(일요일) 또는 매월 1일에 실행하도록 스케줄링할 수 있습니다.
"""


import sys
import os

# backend 루트 디렉토리를 sys.path에 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from app.libs.utils.fcm import send_fcm
from app.core.database import SessionLocal
from app.services.users_service import get_users_last_login

def validate_user(user):
    if not user.fcm_token:
        return False

    if not user.is_push_agree or user.is_push_agree == 0:
        return False

    return True

def user_noti_week():
    db = SessionLocal()

    users = get_users_last_login(db, 7, is_push_agree=1)

    for user in users:
        if validate_user(user) == False:
            continue

        send_fcm(
            token=user.fcm_token,
            title="🥗 BML 식단 알림",
            body="오늘 식단을 아직 등록하지 않으셨어요!",
            data={
                "type": "meal_remind",
                "screen": "MealPlan"
            }
        )

def user_noti_month():
    db = SessionLocal()

    users = get_users_last_login(db, 30, is_push_agree=1)

    for user in users:
        if validate_user(user) == False:
            continue

        send_fcm(
            token=user.fcm_token,
            title="🥗 BML 식단 알림",
            body="한 달 동안 식단을 등록하지 않으셨어요!",
            data={
                "type": "meal_remind",
                "screen": "MealPlan"
            }
        )

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "week":
        user_noti_week()
    elif len(sys.argv) > 1 and sys.argv[1] == "month":
        user_noti_month()
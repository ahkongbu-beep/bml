# app/libs/utils/fcm.py

import os
import firebase_admin
from firebase_admin import credentials, messaging


def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": os.getenv("FCM_PROJECT_ID"),
            "private_key_id": os.getenv("FCM_PRIVATE_KEY_ID"),
            "private_key": os.getenv("FCM_PRIVATE_KEY").replace("\\n", "\n"),
            "client_email": os.getenv("FCM_CLIENT_EMAIL"),
            "token_uri": "https://oauth2.googleapis.com/token",
        })
        firebase_admin.initialize_app(cred)


def send_fcm(token: str, title: str, body: str, data: dict = None):
    init_firebase()

    message = messaging.Message(
        # 🔥 앱 꺼져도 보이게 하는 핵심
        notification=messaging.Notification(
            title=title,
            body=body,
        ),

        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                # channel_id 미지정 시 Firebase가 자동으로 fcm_fallback_notification_channel 사용
                color="#FF9AA2",
                sound="default",
            ),
        ),

        data=data or {},

        token=token
    )

    try:
        response = messaging.send(message)
        print("FCM success:", response)
        return True
    except Exception as e:
        print("FCM error:", e)
        return False
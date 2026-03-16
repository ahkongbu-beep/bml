from app.models.password_reset_token import PasswordResetToken
from datetime import datetime, timedelta

class PasswordResetTokenRepository:

    @staticmethod
    def get_password_reset_count_by_id(db, user_id: int):
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow_start = today_start + timedelta(days=1)

        return (
            db.query(PasswordResetToken).filter(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.created_at >= today_start,
                PasswordResetToken.created_at < tomorrow_start
            )
            .count()
        )

    @staticmethod
    def get_password_reset_by_token(session, token: str):
        current_time = datetime.utcnow()
        return (
            session.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token == token,
                PasswordResetToken.expires_at > current_time,
                PasswordResetToken.used_at.is_(None)
            )
            .first()
        )

    @staticmethod
    def create(db, user_id: int, token: str, expires_at, is_commit=True):

        new_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )

        db.add(new_token)
        if is_commit:
            db.commit()

        db.refresh(new_token)
        db.flush()
        return new_token

    def update(db, reset_token, params):
        if 'token' in params:
            reset_token.token = params['token']
        if 'expires_at' in params:
            reset_token.expires_at = params['expires_at']
        if 'password' in params:
            reset_token.password = params['password']

        reset_token.used_at = datetime.utcnow()

        db.refresh(reset_token)
        db.flush()
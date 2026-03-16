from app.repository.passwords_resets_tokens_repository import PasswordResetTokenRepository
from app.core.config import settings
from sqlalchemy import func
from datetime import datetime
def validate_use_password_reset(db, user_id: int):
    reset_count = PasswordResetTokenRepository.get_password_reset_count_by_id(db, user_id)
    if reset_count >= settings.PASSWORD_RESET_DAILY_LIMIT:
        raise Exception("비밀번호 재설정 요청 한도를 초과했습니다. 내일 다시 시도해주세요.")

def validate_password_token(db, token: str):
    reset_token = PasswordResetTokenRepository.get_password_reset_by_token(db, token)
    if not reset_token:
        raise Exception("유효하지 않은 비밀번호 재설정 토큰입니다.")

    # 만료시간 체크
    if reset_token.expires_at < datetime.utcnow():
        raise Exception("토큰이 만료되었습니다.")

    return reset_token

def create_password_reset_token(db, user_id: int):

    import uuid
    token = str(uuid.uuid4())
    expires_at = func.now() + settings.PASSWORD_RESET_TOKEN_EXPIRE_TIME_MINUTES * 60

    new_token = PasswordResetTokenRepository.create(db, user_id, token, expires_at)
    return new_token

def update_password_reset_token_expire(db, valid_token):

    params = {
        "expires_at": datetime.utcnow(),
    }

    PasswordResetTokenRepository.update(db, valid_token, params)
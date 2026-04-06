
from app.schemas.users_schemas import UserResponse

def serialize_user(user) -> UserResponse:
    return UserResponse(
        sns_login_type=user.sns_login_type,
        sns_id=user.sns_id,
        address=user.address,
        name=user.name,
        nickname=user.nickname,
        email=user.email,
        phone=user.phone,
        role=user.role,
        profile_image=user.profile_image,
        description=user.description,
        is_active=user.is_active,
        marketing_agree=user.marketing_agree,
        push_agree=user.push_agree,
        created_at=user.created_at,
        updated_at=user.updated_at,
        last_login_at=user.last_login_at,
        deleted_at=user.deleted_at,
        view_hash=user.view_hash
    )

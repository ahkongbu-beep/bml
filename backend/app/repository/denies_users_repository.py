from app.models.denies_users import DeniesUsers
from app.libs.serializers.query import SerializerQueryResult

class DeniesUsersRepository:

    """
    user_id 로 차단한 회원 목록 조회
    """
    @staticmethod
    def findByUserIds(session, user_id: int):
        return session.query(DeniesUsers).filter(
            DeniesUsers.user_id == user_id
        ).all()

    """
    user_id 와 deny_user_id 로 차단 정보 조회
    """
    @staticmethod
    def findByUserIdAndDenyUserId(session, user_id: int, deny_user_id: int):
        return session.query(DeniesUsers).filter(
            DeniesUsers.user_id == user_id,
            DeniesUsers.deny_user_id == deny_user_id
        ).first()



    """
    차단 정보 생성
    """
    @staticmethod
    def create(session, params: dict):
        deny_entry = DeniesUsers(
            user_id=params.get("user_id"),
            deny_user_id=params.get("deny_user_id")
        )

        session.add(deny_entry)
        session.commit()
        session.refresh(deny_entry)
        return deny_entry

    @staticmethod
    def deleteByUserIdAndDenyUserId(session, user_id: int, deny_user_id: int):
        session.query(DeniesUsers).filter(
            DeniesUsers.user_id == user_id,
            DeniesUsers.deny_user_id == deny_user_id
        ).delete()
        session.commit()

    """
    user_id 로 차단한 리스트 조회
    """
    @staticmethod
    def findDenyUsersByUserId(session, user_id: int):
        from app.models.users import Users
        query = (
            session.query(
                Users.view_hash.label("user_hash"),
                Users.nickname,
                Users.profile_image,
                DeniesUsers.created_at.label("blocked_at")
            ).join(
                DeniesUsers,
                Users.id == DeniesUsers.deny_user_id
            )
        )

        query = query.filter(
            DeniesUsers.user_id == user_id
        )

        result = query.order_by(DeniesUsers.created_at.desc()).all()
        return SerializerQueryResult(result)

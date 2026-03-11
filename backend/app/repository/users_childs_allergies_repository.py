
from app.models.users_childs_allergies import UserChildAllergy

class UsersChildsAllergiesRepository:

    @staticmethod
    def get_list_by_user_and_child(session, user_id: int, child_id: int):
        return session.query(UserChildAllergy).filter(
            UserChildAllergy.child_id == child_id
        ).all()

    @staticmethod
    def bulk_create(session, user_id: int, child_id: int, items: list, is_commit: bool = True):
        child_allergies = []
        for item in items:
            # 딕셔너리와 객체 모두 지원
            allergy_code = item["allergy_code"] if isinstance(item, dict) else item.allergy_code
            allergy_name = item["allergy_name"] if isinstance(item, dict) else item.allergy_name

            child_allergy = UserChildAllergy(
                allergy_code=allergy_code,
                allergy_name=allergy_name,
                user_id=user_id,
                child_id=child_id
            )
            child_allergies.append(child_allergy)

        session.bulk_save_objects(child_allergies)
        if is_commit:
            session.commit()
        return child_allergies

    @staticmethod
    def bulk_delete(session, user_id: int, child_id: int, is_commit: bool = True):
        session.query(UserChildAllergy).filter(
            UserChildAllergy.user_id == user_id,
            UserChildAllergy.child_id == child_id
        ).delete(synchronize_session=False)

        if is_commit:
            session.commit()
        return

from app.models.users_childs_allergies import UsersChildsAllergies

class UsersChildsAllergiesRepository:

    @staticmethod
    def get_list_by_user_and_child(session, user_id: int, child_id: int):
        return session.query(UsersChildsAllergies).filter(
            UsersChildsAllergies.child_id == child_id
        ).all()

    @staticmethod
    def bulk_create(session, user_id: int, child_id: int, items: list, is_commit: bool = True):
        child_allergies = []
        for item in items:
            # 딕셔너리와 객체 모두 지원
            allergy_code = item.get("food_code")
            allergy_name = item.get("food_name")

            child_allergy = UsersChildsAllergies(
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
        session.query(UsersChildsAllergies).filter(
            UsersChildsAllergies.user_id == user_id,
            UsersChildsAllergies.child_id == child_id
        ).delete(synchronize_session=False)

        if is_commit:
            session.commit()
        return
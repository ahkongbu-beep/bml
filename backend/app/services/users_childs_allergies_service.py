from app.repository.users_childs_allergies_repository import UsersChildsAllergiesRepository

def bulk_create_user_child_allergies(db, user_id, child_id, allergies_data, is_commit=True):

    return UsersChildsAllergiesRepository.bulk_create(
        db,
        user_id=user_id,
        child_id=child_id,
        items=allergies_data,
        is_commit=is_commit
    )
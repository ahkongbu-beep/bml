from app.repository.users_childs_repository import UsersChildsRepository

def get_agent_childs(db, params):
    if params.get("user_id"):
        return UsersChildsRepository.get_agent_childs_by_user_id(db, params.get("user_id"))

def get_child_by_id(db, child_id):
    return UsersChildsRepository.get_child_by_id(db, child_id)

def get_child_by_id_and_name(db, child_id, child_name):
    return UsersChildsRepository.get_child_by_id_and_name(db, child_id, child_name)

def validate_agent_childs(db, params):
    child = get_agent_childs(db, params)
    if not child:
        raise Exception("확인되지 않는 자녀 정보 입니다.")
    return child

def get_list_with_allergies_data(result):
    for data in result:
        if data.allergy_codes:
            data.allergy_codes = data.allergy_codes.split(",") if data.allergy_codes else []
            data.allergy_names = data.allergy_names.split(",") if data.allergy_names else []
    return result

def get_list_with_allergies(db, user_id):
    data = UsersChildsRepository.get_list_with_allergies(db, user_id)
    return get_list_with_allergies_data(data)

def create_child(db, user_id: int, child_data: dict):
    return UsersChildsRepository.create(
        db,
        user_id,
        child_data.get("child_name"),
        child_data.get("child_birth"),
        child_data.get("child_gender"),
        child_data.get("is_agent"),
        is_commit=False
    )

def update_child(db, child_instance, params, is_commit=True):
    if not child_instance:
        raise Exception("자녀 정보가 존재하지 않습니다.")

    return UsersChildsRepository.update(db, child_instance, params, is_commit=is_commit)

def delete_child(db, child_instance, is_commit=True):
    if not child_instance:
        raise Exception("자녀 정보가 존재하지 않습니다.")

    return UsersChildsRepository.delete(db, child_instance, {"is_deleted": "Y"}, is_commit=is_commit)
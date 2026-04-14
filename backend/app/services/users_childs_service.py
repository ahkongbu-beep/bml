from app.repository.users_childs_repository import UsersChildsRepository

def child_list(db, params):
    return UsersChildsRepository.get_child_list(db, params)

def child_and_allergy_list(db, params):
    from app.services.users_childs_allergies_service import get_user_child_allergies

    childs_data = []
    childs = UsersChildsRepository.get_child_list(db, params)
    for child in childs:

        child_allergy = get_user_child_allergies(db, params.get("user_id"), child.id)

        child_allergy_data = []
        for allergy in child_allergy:
            allergy_data = {
                "allergy_codes": allergy.allergy_code,
                "allergy_names": allergy.allergy_name
            }
            child_allergy_data.append(allergy_data)

        child_data = {
            "id": child.id,
            "child_id": child.id,
            "child_name": child.child_name,
            "child_birth": str(child.child_birth),
            "child_gender": child.child_gender,
            "is_agent": child.is_agent,
            "allergy_codes": [a["allergy_codes"] for a in child_allergy_data],
            "allergy_names": [a["allergy_names"] for a in child_allergy_data],
            "allergies": child_allergy_data
        }

        childs_data.append(child_data)
    return childs_data

def get_agent_childs(db, params):
    if params.get("user_id"):
        return UsersChildsRepository.get_agent_childs_by_user_id(db, params.get("user_id"))

def get_child_by_id(db, child_id):
    return UsersChildsRepository.get_child_by_id(db, child_id)

def get_child_by_user_id_and_name(db, user_id, child_name):
    return UsersChildsRepository.get_child_by_user_id_and_name(db, user_id, child_name)

def validate_agent_childs(db, params):
    child = get_agent_childs(db, params)
    if not child:
        raise Exception("확인되지 않는 자녀 정보 입니다.")
    return child

def get_list_with_allergies_data(result):
    data_list = []
    for row in result:
        data = dict(row._mapping)
        data["allergy_codes"] = data["allergy_codes"].split(",") if data.get("allergy_codes") else []
        data["allergy_names"] = data["allergy_names"].split(",") if data.get("allergy_names") else []
        data_list.append(data)
    return data_list

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
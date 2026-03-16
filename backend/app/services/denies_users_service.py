from app.repository.denies_users_repository import DeniesUsersRepository

def get_denies_user_id_list(db, user_id: int):
    deny_users = DeniesUsersRepository.get_denies_users_by_user_id(db, user_id)
    return [du.deny_user_id for du in deny_users]

def get_denies_user_list(db, user_id: int):
    return DeniesUsersRepository.get_denies_users_by_user_id(db, user_id)

def get_denies_user_by_id(db, user_id: int, deny_user_id: int):
    return DeniesUsersRepository.get_deny_user_by_user_id_and_deny_user_id(db, user_id, deny_user_id)

def deny_user_process(db, user_id: int, deny_user_id: int):

    # 차단 처리
    exist_deny_user = get_denies_user_by_id(db, user_id, deny_user_id)

    if exist_deny_user:
        DeniesUsersRepository.delete(db, user_id, deny_user_id)
    else:
        DeniesUsersRepository.create(db, {"user_id": user_id, "deny_user_id": deny_user_id})
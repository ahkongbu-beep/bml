from app.repository.denies_users_repository import DeniesUsersRepository

def get_denies_user_id_list(db, user_id: int):
    deny_users = DeniesUsersRepository.get_denies_users_by_user_id(db, user_id)
    return [du.deny_user_id for du in deny_users]

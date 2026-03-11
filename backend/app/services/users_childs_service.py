from app.repository.users_childs_repository import UsersChildsRepository

def get_agent_childs(db, params):
    if params.get("user_id"):
        return UsersChildsRepository.get_agent_childs_by_user_id(db, params.get("user_id"))
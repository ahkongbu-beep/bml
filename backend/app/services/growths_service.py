from app.repository.growths_repository import GrowthsRepository
from app.services.users_service import validate_user

def get_growth_list(db, user_hash, body):
    try:
        validate_user(db, user_hash)

        params = {}
        if body.gender:
            params['gender'] = body.gender

        if body.months is not None:
            params['months'] = body.months

        list = GrowthsRepository.get_growths_all(db, params)

        result = {}

        for v in list:
            percent = v.percent
            value   = float(v.value)
            months  = int(float(v.months))
            gender  = v.gender
            type    = v.type

            if type not in result:
                result[type] = {}

            if gender not in result[type]:
                result[type][gender] = {}

            if percent not in result[type][gender]:
                result[type][gender][percent] = []

            result[type][gender][percent].append({
                "months": months,
                "value": value
            })

        return {"success": True, "error": None, "data": result}

    except Exception as e:

        return {"success": False, "error": str(e), "data": None}


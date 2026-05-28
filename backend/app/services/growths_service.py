import datetime

from app.repository.growths_repository import GrowthsRepository
from app.repository.growths_reports_repository import GrowthsReportsRepository
from app.services.users_service import validate_user
from app.services.users_childs_service import get_child_by_id

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

def create_growth_report(db, user_hash, child_id, body):
    """
    성장 리포트 추가
    """
    try:
        user = validate_user(db, user_hash)

        today = datetime.date.today()

        created_count = 0

        for report in body.reports:
            type = report.type
            months = report.months
            value = report.value

            if value > 999.9:
                if type == "height":
                    type_str = "키"
                elif type == "weight":
                    type_str = "몸무게"
                else:
                    type_str = "머리둘레"
                raise ValueError(f"{type_str} 입력 범위를 초과하였습니다. (0~999.9)")

            percent = str(report.percent)

            exist_report = GrowthsReportsRepository.validate_report_exists(db, user.id, child_id, type, today)

            growth_data = {
                "type": type,
                "months": months,
                "value": value,
                "percent": percent,
                "child_id": child_id,
                "user_id": user.id
            }
            if exist_report:
                GrowthsReportsRepository.update(db, exist_report, growth_data)
            else:
                GrowthsReportsRepository.create(db, growth_data)

            created_count += 1

        db.commit()

        return {"success": True, "error": None, "data": {"created_count": created_count}}

    except ValueError as e:
        return {"success": False, "error": str(e), "data": None}
    except Exception as e:
        print(f"⭕⭕Exception: {str(e)}")
        return {"success": False, "error": "성장 리포트 생성 중 오류가 발생했습니다.", "data": None}

def get_growth_report(db, user_hash, child_id):
    """
    성장 리포트 조회
    """
    try:
        user = validate_user(db, user_hash)

        child_user = get_child_by_id(db, child_id)
        if not child_user or child_user.user_id != user.id:
            return {"success": False, "error": "해당 자녀 정보에 접근할 권한이 없습니다.", "data": None}

        reports = GrowthsReportsRepository.get_reports_by_child_id(db, user.id, child_user.id)

        result = []
        for report in reports:
            result.append({
                "id": report.id,
                "type": report.type,
                "months": report.months,
                "value": float(report.value),
                "percent": report.percent,
                "created_at": report.created_at.isoformat()
            })

        return {"success": True, "error": None, "data": result}
    except ValueError as e:
        return {"success": False, "error": str(e), "data": None}
    except Exception as e:
        return {"success": False, "error": "성장 리포트 조회 중 오류가 발생했습니다.", "data": None}
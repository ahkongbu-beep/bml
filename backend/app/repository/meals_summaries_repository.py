import json
from app.models.meals_summaries import MealsSummaries

class MealsSummariesRepository:

    @staticmethod
    def get_meal_summary_by_id(session, summary_id):
        """
        ID로 식단 요약 정보 조회
        """
        return session.query(MealsSummaries).filter(MealsSummaries.id == summary_id).first()

    @staticmethod
    def get_meal_summary_by_view_hash(session, view_hash):
        """
        view_hash로 식단 요약 정보 조회
        """
        return session.query(MealsSummaries).filter(MealsSummaries.view_hash == view_hash).first()

    @staticmethod
    def create_meal_summary(session, params):
        """
        임시 식단 요약 저장
        """
        analysis_json = params.get("analysis_json")
        if isinstance(analysis_json, (dict, list)):
            analysis_json = json.dumps(analysis_json, ensure_ascii=False)

        temp_meal_summary = MealsSummaries(
            user_id=params.get("user_id"),
            total_score=params.get("total_score"),
            total_summary=params.get("total_summary"),
            analysis_json=analysis_json,
            suggestion=params.get("suggestion"),
            view_hash=params.get("view_hash"),
            is_active=params.get("is_active"),
            is_temp=params.get("is_temp"),   # 초기 값은 Y로 설정
        )
        session.add(temp_meal_summary)
        session.flush()
        session.refresh(temp_meal_summary)
        return temp_meal_summary

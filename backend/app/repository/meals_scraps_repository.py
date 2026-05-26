from app.models.meals_scraps import MealsScrap

class MealsScrapsRepository:

    @staticmethod
    def get_scrap_by_max_sort_order(session, user_id):
        """
        사용자별 최대 정렬 순서 조회
        """
        max_sort_order = session.query(MealsScrap.sort_order).filter(MealsScrap.user_id == user_id).order_by(MealsScrap.sort_order.desc()).first()
        return max_sort_order[0] if max_sort_order else 0

    @staticmethod
    def get_scrap_by_id(session, scrap_id):
        """
        ID로 스크랩 정보 조회
        """
        return session.query(MealsScrap).filter(MealsScrap.id == scrap_id).first()

    @staticmethod
    def get_scrap_list_by_user_id(session, user_id):
        """
        사용자별 스크랩 리스트 조회
        """
        return session.query(MealsScrap).filter(MealsScrap.user_id == user_id, MealsScrap.is_active == "Y").order_by(MealsScrap.sort_order.desc()).all()

    @staticmethod
    def get_scrap_by_user_and_meal(session, user_id, meal_id):
        """
        사용자와 식단 ID로 스크랩 정보 조회
        """
        return session.query(MealsScrap).filter(MealsScrap.user_id == user_id, MealsScrap.meal_id == meal_id).first()

    @staticmethod
    def create(session, params):
        """
        스크랩 정보 생성
        """
        scrap = MealsScrap(
            user_id=params.get("user_id"),
            meal_id=params.get("meal_id"),
            is_active=params.get("is_active", "Y"),
            sort_order=params.get("sort_order", 0),
            memo=params.get("memo", "")
        )
        session.add(scrap)
        session.flush()
        session.refresh(scrap)
        return scrap

    @staticmethod
    def update(session, scrap, is_active=None, memo=None, sort_order=None):
        """
        스크랩 정보 업데이트
        """
        if is_active is not None:
            scrap.is_active = is_active

        if memo is not None:
            scrap.memo = memo

        if sort_order is not None:
            scrap.sort_order = sort_order

        session.add(scrap)
        session.flush()
        session.refresh(scrap)
        return scrap
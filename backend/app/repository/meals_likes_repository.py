from app.models.feeds_images import FeedsImages
from app.models.meals_likes import MealsLikes
from app.models.meals_calendar import MealsCalendars
from sqlalchemy import func

class MealsLikesRepository:

    @staticmethod
    def get_like_by_meal_id(session, meal_id: int):
        return session.query(MealsLikes).filter(MealsLikes.meal_id == meal_id).first()

    @staticmethod
    def create(session, meal_id: int, user_id: int, is_commit=True):
        like = MealsLikes(
            meal_id=meal_id,
            user_id=user_id,
            created_at=func.now()
        )
        session.add(like)
        if is_commit:
            session.commit()
        else:
            session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음
        return like

    @staticmethod
    def increment_like_count(session, meal_id: int, is_commit=True):
        session.query(MealsCalendars).filter(MealsCalendars.id == meal_id).update(
            {MealsCalendars.like_count: MealsCalendars.like_count + 1}
        )
        if is_commit:
            session.commit()
        else:
            session.flush()  # 변경사항을 DB에 반영하지만 커밋하지는 않음

    @staticmethod
    def get_like_by_feed_and_user(session, meal_id: int, user_id: int):
        return session.query(MealsLikes).filter(
            MealsLikes.meal_id == meal_id,
            MealsLikes.user_id == user_id
        ).first()

    @staticmethod
    def get_like_user_id(session, user_id: int, limit=30, offset=0):
        feed_image_subq = (
            session.query(FeedsImages.image_url)
            .filter(FeedsImages.img_model == "Feeds")
            .filter(FeedsImages.img_model_id == MealsCalendars.id)
            .order_by(FeedsImages.id.asc())
            .limit(1)
            .correlate(MealsCalendars)
            .scalar_subquery()
        )

        query = (
            session.query(
                MealsLikes.meal_id,
                MealsLikes.created_at.label("liked_at"),
                MealsCalendars.title,
                MealsCalendars.content,
                feed_image_subq.label("feed_image_url"),
            )
            .join(MealsCalendars, MealsLikes.feed_id == MealsCalendars.id)
            .filter(MealsLikes.user_id == user_id)
            .order_by(MealsLikes.created_at.desc())
        )

        return query.all()
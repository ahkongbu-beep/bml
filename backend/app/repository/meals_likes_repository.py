from app.models.attaches_files import AttachesFiles
from app.models.meals_likes import MealsLikes
from app.models.meals_calendar import MealsCalendars

from sqlalchemy import func

class MealsLikesRepository:
    def delete_likes_by_meal_calendar_id(db, meal_calendar_id: int):
        db.query(MealsLikes).filter(MealsLikes.meal_id == meal_calendar_id).delete()
        db.flush()

    def get_likes_by_user_id(session, user_id: int):
        return session.query(MealsLikes).filter(MealsLikes.user_id == user_id).all()

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
        from app.models.users import Users

        image_subq = (
            session.query(AttachesFiles.image_url)
            .filter(AttachesFiles.img_model_id == MealsCalendars.id)
            .order_by(AttachesFiles.id.asc())
            .limit(1)
            .correlate(MealsCalendars)
            .scalar_subquery()
        )

        user_subq = (
            session.query(Users.view_hash)
            .filter(Users.id == MealsCalendars.user_id)
            .correlate(MealsCalendars)
            .scalar_subquery()
        )

        query = (
            session.query(
                MealsLikes.meal_id,
                MealsLikes.created_at.label("liked_at"),
                MealsCalendars.title,
                MealsCalendars.contents,
                MealsCalendars.view_hash,
                image_subq.label("image_url"),
                user_subq.label("user_hash"),
            )
            .join(MealsCalendars, MealsLikes.meal_id == MealsCalendars.id)
            .filter(MealsLikes.user_id == user_id)
            .order_by(MealsLikes.created_at.desc())
        )

        return query.all()

    @staticmethod
    def delete(session, like):
        if like:
            session.delete(like)
        return True
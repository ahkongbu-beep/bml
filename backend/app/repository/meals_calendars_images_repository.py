from app.models.meals_calendars_images import MealsCalendarsImages
import os

class MealsCalendarsImagesRepository:

    @staticmethod
    async def get_active_user(session, user_id: int, order_by=None):

        query = session.query(MealsCalendarsImages).filter(
            MealsCalendarsImages.user_id == user_id,
            MealsCalendarsImages.is_active == "Y"
        )

        if order_by == "id desc":
            query = query.order_by(MealsCalendarsImages.id.desc())
        elif order_by == "id asc":
            query = query.order_by(MealsCalendarsImages.id.asc())
        elif order_by == "month desc":
            query = query.order_by(MealsCalendarsImages.month.desc())
        elif order_by == "month asc":
            query = query.order_by(MealsCalendarsImages.month.asc())

        return query.all()

    @staticmethod
    async def upload(session, user_id: int, month: str, file) -> bool:
        if not file:
            return False

        """
        업로드된 이미지를 여러 사이즈로 리사이징하여 WebP로 저장
        /attaches/{path}/{table.pk 뒤에 2자리}/{table.pk}/{base_filename}_{size}.webp
        ex) /attaches/Feeds/45/12345/20260123120000_abc123_medium.webp

        DB에는 확장자와 사이즈 접미사 없이 저장: /attaches/Feeds/45/12345/20260123120000_abc123
        """
        from app.libs.file_utils import save_upload_file_with_resize, get_file_url

        try:
            # 저장 디렉토리 경로
            destination_path = os.path.join(
                "attaches",
                "MealsCalendarsImages",
                str(user_id)[-2:] if len(str(user_id)) >= 2 else "0" + str(user_id),
                str(user_id)
            )

            # 이미지 리사이징 및 저장
            success, result, original_filename, created_files = await save_upload_file_with_resize(file, destination_path)

            if not success:
                return False

            # 확장자와 사이즈 접미사 제거 (프론트엔드에서 조합)
            image_url = get_file_url(result, base_url="")
            # /attaches/Feeds/45/12345/20260123120000_abc123_medium.webp -> /attaches/Feeds/45/12345/20260123120000_abc123
            image_path = image_url.replace('\\', '/')
            if '_medium.webp' in image_path:
                image_path = image_path.replace('_medium.webp', '')
            elif '.webp' in image_path:
                # _사이즈.webp 패턴 제거
                image_path = image_path.rsplit('_', 1)[0] if '_' in image_path.rsplit('/', 1)[-1] else image_path.rsplit('.', 1)[0]

            return {
                "path": image_path,
            }
        except Exception as e:
            return False

    @staticmethod
    async def create(session, params, is_commit=True) -> bool:
        user_id = params.get("user_id")
        month = params.get("month")
        image = params.get("image")   # 이미 완성된 경로 문자열
        is_active = params.get("is_active", "Y")

        # 새로운 이미지 생성
        new_image = MealsCalendarsImages(
            user_id=user_id,
            month=month,
            image=image,
            is_active=is_active
        )
        session.add(new_image)
        if is_commit:
            session.commit()
        else:
            session.flush()

        return new_image

    @staticmethod
    def delete_active_calendar_images_by_month(session, user_id: int, month: str, is_commit=True) -> bool:
        # 기존 이미지 삭제
        session.query(MealsCalendarsImages).filter(
            MealsCalendarsImages.user_id == user_id,
            MealsCalendarsImages.month == month,
            MealsCalendarsImages.is_active == "Y"
        ).delete(synchronize_session=False)

        if is_commit:
            session.commit()
        else:
            session.flush()
        return True
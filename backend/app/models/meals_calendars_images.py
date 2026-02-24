from sqlalchemy import Column, Integer, String, Index, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from app.core.database import Base
import os

class MealsCalendarImage(Base):
    __tablename__ = "meals_calendars_images"

    id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, nullable=False, default=0, comment="users.pk")
    month = Column(String(20), nullable=False, default="", comment="날짜 Y-m")
    image = Column(String(255), nullable=False, default="", comment="캘린더 이미지")
    is_active = Column(String(2), nullable=False, default="Y", comment="사용여부")

    __table_args__ = (
        UniqueConstraint("user_id", "month", "is_active", name="user_month"),
        Index("idx_user_month", "user_id", "month"),
    )

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


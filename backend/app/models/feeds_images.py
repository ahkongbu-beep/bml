from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.libs.hash_utils import generate_sha256_hash
from app.core.config import settings
from app.models.feeds import Feeds
import os


class FeedsImages(Base):
    __tablename__ = "feeds_images"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    img_model = Column(String(50), nullable=False, comment="이미지 모델명 (Feeds)")
    img_model_id = Column(Integer, ForeignKey("feeds.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False, comment="이미지 경로(URL)")
    sort_order = Column(Integer, nullable=False, default=0, comment="정렬 순서 (0=첫번째)")
    width = Column(Integer, nullable=True, comment="원본 width")
    height = Column(Integer, nullable=True, comment="원본 height")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Enum("Y", "N"), default="Y", nullable=True, comment="사용여부")

    # feeds 테이블과 연결 (역참조)
    feed = relationship("Feeds", back_populates="images")

    # feed_id 로 이미지 삭제
    @staticmethod
    def deleteByFeedId(session, model: str, model_id: int):
        """
        feed_id 로 이미지 삭제 (파일 시스템 + DB)
        """
        result = {
            "success": False,
            "deleted_files": 0,
            "missing_files": 0,
            "db_deleted": False,
            "error": None,
        }

        feed_images = session.query(FeedsImages).filter(
            FeedsImages.img_model == model,
            FeedsImages.img_model_id == model_id
        ).all()

        # 파일 삭제
        for feed_image in feed_images:
            if not feed_image.image_url:
                continue

            file_path = feed_image.image_url.lstrip('/')

            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                    result["deleted_files"] += 1
                else:
                    result["missing_files"] += 1
            except Exception as e:
                result["error"] = str(e)

        # DB 삭제
        try:
            session.query(FeedsImages).filter(
                FeedsImages.img_model == model,
                FeedsImages.img_model_id == model_id
            ).delete()

            session.query(Feeds).filter(Feeds.id == model_id).delete()

            session.commit()

            result["db_deleted"] = True
            result["success"] = True
        except Exception as e:
            session.rollback()
            result["error"] = str(e)

        return result

    # 이미지 목록 조회
    @staticmethod
    def findImagesByModelId(session, model: str, model_id: int):
        """
        model과 model_id로 이미지 목록 조회
        """
        result = session.query(FeedsImages).filter(FeedsImages.img_model == model, FeedsImages.img_model_id == model_id).order_by(FeedsImages.sort_order.asc()).all()
        return [settings.BACKEND_SHOP_URL + img.image_url for img in result]

    # 이미지 레코드 생성
    @staticmethod
    def create(session, params: dict):
        image = FeedsImages(
            img_model=params.get("img_model", "Feeds"),
            img_model_id=params.get("img_model_id"),
            image_url=params.get("image_url"),
            sort_order=params.get("sort_order", 0),
            width=params.get("width"),
            height=params.get("height"),
            is_active=params.get("is_active", "Y")
        )

        session.add(image)
        session.commit()
        session.refresh(image)
        return image

    # 이미지 파일을 저장하는 메소드
    @staticmethod
    async def upload(session, model_id: int, file, ext: str, path: str = "feeds", sort_order: int = 0):
        """
        /attaches/{path}/{table.pk 뒤에 2자리}/{table.pk}/{filename}
        ex) /attaches/feeds/45/12345/image.{ext}
        filename 은 hash 처리
        """
        path = path.capitalize()

        try:
            filename_hash = generate_sha256_hash(str(model_id), str(datetime.utcnow().timestamp()))
            filename = f"{filename_hash}.{ext}"

            destination_path = os.path.join("attaches", path, str(model_id)[-2:] if len(str(model_id)) >= 2 else "0" + str(model_id), str(model_id))
            os.makedirs(destination_path, exist_ok=True)

            file_path = os.path.join(destination_path, filename)

            # UploadFile 객체에서 파일 읽기
            contents = await file.read()
            with open(file_path, 'wb') as f:
                f.write(contents)

            # URL 경로 생성 (StaticFiles에서 접근 가능하도록)
            file_url = f"/attaches/{path}/{str(model_id)[-2:] if len(str(model_id)) >= 2 else '0' + str(model_id)}/{str(model_id)}/{filename}"

            # DB에 이미지 정보 저장
            image_params = {
                "img_model": path,
                "img_model_id": model_id,
                "image_url": file_url,
                "sort_order": sort_order,
                "is_active": "Y"
            }

            return FeedsImages.create(session, image_params)

        except Exception as e:
            print(f"Image upload error: {str(e)}")
            return None


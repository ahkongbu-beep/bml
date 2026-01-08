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
    feed_id = Column(Integer, ForeignKey("feeds.id", ondelete="CASCADE"), nullable=False)
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
    def deleteByFeedId(session, feed_id: int):
        """
        feed_id 로 이미지 삭제 (파일 시스템 + DB)
        """
        feed_images = session.query(FeedsImages).filter(FeedsImages.feed_id == feed_id).all()

        # 각 이미지 파일 삭제
        for feed_image in feed_images:
            if feed_image.image_url:
                # /attaches/feeds/07/7/b84e4bfa13978643509204066292ec7c686468f750588702e44d5c388b996d87.jpeg
                # URL 경로를 실제 파일 경로로 변환
                file_path = feed_image.image_url.lstrip('/')

                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                        print(f"✅ 이미지 파일 삭제 성공: {file_path}")
                    else:
                        print(f"⚠️ 이미지 파일이 존재하지 않음: {file_path}")
                except Exception as e:
                    print(f"⚠️ 이미지 파일 삭제 실패: {file_path}, 오류: {str(e)}")

        # DB에서 레코드 삭제
        try:
            session.query(FeedsImages).filter(FeedsImages.feed_id == feed_id).delete()
            session.query(Feeds).filter(Feeds.id == feed_id).delete()
            session.commit()
            print(f"✅ DB 이미지 레코드 삭제 성공: feed_id={feed_id}")
        except Exception as e:
            session.rollback()
            print(f"⚠️ DB 이미지 레코드 삭제 실패: feed_id={feed_id}, 오류: {str(e)}")

        session.commit()

    # 이미지 목록 조회
    @staticmethod
    def findImagesByFeedId(session, feed_id: int):
        """
        feed_id 로 이미지 목록 조회
        """
        result = session.query(FeedsImages).filter(FeedsImages.feed_id == feed_id).order_by(FeedsImages.sort_order.asc()).all()
        return [settings.BACKEND_SHOP_URL + img.image_url for img in result]

    # 이미지 레코드 생성
    @staticmethod
    def create(session, params: dict):
        image = FeedsImages(
            feed_id=params.get("feed_id"),
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
    async def upload(session, feed_id: int, file, ext: str, path: str = "feeds", sort_order: int = 0):
        """
        /attaches/{path}/{table.pk 뒤에 2자리}/{table.pk}/{filename}
        ex) /attaches/feeds/45/12345/image.{ext}
        filename 은 hash 처리
        """
        try:
            filename_hash = generate_sha256_hash(str(feed_id), str(datetime.utcnow().timestamp()))
            filename = f"{filename_hash}.{ext}"

            destination_path = os.path.join("attaches", path, str(feed_id)[-2:] if len(str(feed_id)) >= 2 else "0" + str(feed_id), str(feed_id))
            os.makedirs(destination_path, exist_ok=True)

            file_path = os.path.join(destination_path, filename)

            # UploadFile 객체에서 파일 읽기
            contents = await file.read()
            with open(file_path, 'wb') as f:
                f.write(contents)

            # URL 경로 생성 (StaticFiles에서 접근 가능하도록)
            file_url = f"/attaches/{path}/{str(feed_id)[-2:] if len(str(feed_id)) >= 2 else '0' + str(feed_id)}/{str(feed_id)}/{filename}"

            # DB에 이미지 정보 저장
            image_params = {
                "feed_id": feed_id,
                "image_url": file_url,
                "sort_order": sort_order,
                "is_active": "Y"
            }

            return FeedsImages.create(session, image_params)

        except Exception as e:
            print(f"Image upload error: {str(e)}")
            return None


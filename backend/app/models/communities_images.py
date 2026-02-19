from sqlalchemy import Column, BigInteger, Integer, String, DateTime, Enum, Index
from datetime import datetime
from app.core.database import Base
import os
import glob


class CommunitiesImages(Base):
    __tablename__ = "communities_images"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    community_id = Column(Integer, nullable=False, comment="커뮤니티 ID (communities.id)")
    image_url = Column(String(500), nullable=False, comment="이미지 경로(URL)")
    sort_order = Column(Integer, nullable=False, default=0, comment="정렬 순서 (0=첫번째)")
    width = Column(Integer, nullable=True, comment="원본 width")
    height = Column(Integer, nullable=True, comment="원본 height")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Enum("Y", "N"), default="Y", nullable=True, comment="사용여부")

    __table_args__ = (
        Index("idx_community_id", "community_id"),
    )

    # community_id로 이미지 삭제
    @staticmethod
    def deleteByCommunityId(session, community_id: int, is_commit: bool = True):
        """
        community_id로 이미지 삭제 (파일 시스템 + DB)
        리사이징된 모든 사이즈 파일 삭제 (_original, _large, _medium, _small, _thumbnail)
        """
        result = {
            "success": False,
            "deleted_files": 0,
            "missing_files": 0,
            "db_deleted": False,
            "error": None,
        }

        community_images = session.query(CommunitiesImages).filter(
            CommunitiesImages.community_id == community_id
        ).all()

        # 파일 삭제 (모든 사이즈)
        for community_image in community_images:
            if not community_image.image_url:
                continue

            file_base_path = community_image.image_url.lstrip('/')

            try:
                # DB에 저장된 경로는 확장자와 사이즈 접미사가 없음
                # 패턴: {base_path}_*.webp (모든 사이즈 파일 찾기)
                matching_files = glob.glob(f"{file_base_path}_*.webp")

                if matching_files:
                    for file_path in matching_files:
                        if os.path.exists(file_path):
                            os.remove(file_path)
                            result["deleted_files"] += 1
                else:
                    result["missing_files"] += 1
            except Exception as e:
                result["error"] = str(e)

        # DB 삭제
        try:
            session.query(CommunitiesImages).filter(
                CommunitiesImages.community_id == community_id
            ).delete()

            if is_commit:
                session.commit()

            result["db_deleted"] = True
            result["success"] = True
        except Exception as e:
            session.rollback()
            result["error"] = str(e)

        return result

    # 이미지 목록 조회
    @staticmethod
    def findImagesByCommunityId(session, community_id: int):
        """
        community_id로 이미지 목록 조회
        프론트엔드에서 backend_url과 확장자를 조합할 수 있도록 경로만 반환
        """
        result = session.query(CommunitiesImages).filter(
            CommunitiesImages.community_id == community_id
        ).order_by(CommunitiesImages.sort_order.asc()).all()
        return [img.image_url.replace('\\', '/') for img in result]

    # 이미지 레코드 생성
    @staticmethod
    def create(session, params: dict):
        image = CommunitiesImages(
            community_id=params.get("community_id"),
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

    # 이미지 파일을 저장하는 메소드 (리사이징 지원)
    @staticmethod
    async def upload(session, community_id: int, file, ext: str, sort_order: int = 0):
        """
        업로드된 이미지를 여러 사이즈로 리사이징하여 WebP로 저장
        /attaches/Communities/{table.pk 뒤에 2자리}/{table.pk}/{base_filename}_{size}.webp
        ex) /attaches/Communities/45/12345/20260123120000_abc123_medium.webp

        DB에는 확장자와 사이즈 접미사 없이 저장: /attaches/Communities/45/12345/20260123120000_abc123
        """
        from app.libs.file_utils import save_upload_file_with_resize, get_file_url

        try:
            # 저장 디렉토리 경로
            destination_path = os.path.join(
                "attaches",
                "Communities",
                str(community_id)[-2:] if len(str(community_id)) >= 2 else "0" + str(community_id),
                str(community_id)
            )

            # 이미지 리사이징 및 저장
            success, result, original_filename, created_files = await save_upload_file_with_resize(file, destination_path)

            if not success:
                print(f"❌ 이미지 업로드 실패: {result}")
                return None

            # 확장자와 사이즈 접미사 제거 (프론트엔드에서 조합)
            image_url = get_file_url(result, base_url="")
            # /attaches/Communities/45/12345/20260123120000_abc123_medium.webp -> /attaches/Communities/45/12345/20260123120000_abc123
            image_path = image_url.replace('\\', '/')
            if '_medium.webp' in image_path:
                image_path = image_path.replace('_medium.webp', '')
            elif '.webp' in image_path:
                # _사이즈.webp 패턴 제거
                import re
                image_path = re.sub(r'_[a-z]+\.webp$', '', image_path)

            # DB에 이미지 레코드 생성
            params = {
                "community_id": community_id,
                "image_url": image_path,
                "sort_order": sort_order,
                "is_active": "Y",
            }

            return CommunitiesImages.create(session, params)

        except Exception as e:
            print(f"❌ 이미지 업로드 중 오류: {str(e)}")
            return None
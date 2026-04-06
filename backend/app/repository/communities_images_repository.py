from app.models.communities_images import CommunitiesImages

class CommunitiesImagesRepository:
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

    # # 이미지 파일을 저장하는 메소드 (리사이징 지원)
    # @staticmethod
    # async def upload(session, community_id: int, file, ext: str, sort_order: int = 0):
    #     """
    #     업로드된 이미지를 여러 사이즈로 리사이징하여 WebP로 저장
    #     /attaches/Communities/{table.pk 뒤에 2자리}/{table.pk}/{base_filename}_{size}.webp
    #     ex) /attaches/Communities/45/12345/20260123120000_abc123_medium.webp

    #     DB에는 확장자와 사이즈 접미사 없이 저장: /attaches/Communities/45/12345/20260123120000_abc123
    #     """
    #     from app.libs.file_utils import save_upload_file_with_resize, get_file_url

    #     try:
    #         # 저장 디렉토리 경로
    #         destination_path = os.path.join(
    #             "attaches",
    #             "Communities",
    #             str(community_id)[-2:] if len(str(community_id)) >= 2 else "0" + str(community_id),
    #             str(community_id)
    #         )

    #         # 이미지 리사이징 및 저장
    #         success, result, original_filename, created_files = await save_upload_file_with_resize(file, destination_path)

    #         if not success:
    #             print(f"❌ 이미지 업로드 실패: {result}")
    #             return None

    #         # 확장자와 사이즈 접미사 제거 (프론트엔드에서 조합)
    #         image_url = get_file_url(result, base_url="")
    #         # /attaches/Communities/45/12345/20260123120000_abc123_medium.webp -> /attaches/Communities/45/12345/20260123120000_abc123
    #         image_path = image_url.replace('\\', '/')
    #         if '_medium.webp' in image_path:
    #             image_path = image_path.replace('_medium.webp', '')
    #         elif '.webp' in image_path:
    #             # _사이즈.webp 패턴 제거
    #             import re
    #             image_path = re.sub(r'_[a-z]+\.webp$', '', image_path)

    #         # DB에 이미지 레코드 생성
    #         params = {
    #             "community_id": community_id,
    #             "image_url": image_path,
    #             "sort_order": sort_order,
    #             "is_active": "Y",
    #         }

    #         return CommunitiesImages.create(session, params)

    #     except Exception as e:
    #         print(f"❌ 이미지 업로드 중 오류: {str(e)}")
    #         return None
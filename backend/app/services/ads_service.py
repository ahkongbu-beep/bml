from app.repository.ads_repository import AdsRepository
from app.repository.ads_clicks_logs_repository import AdsClicksLogsRepository
from app.repository.advertisers_repository import AdvertiserRepository
from app.schemas.common_schemas import CommonResponse
import hashlib

from app.services.attaches_files_service import upload_file, save_upload_file

def validate_body(body):
    if not body.advertiser_hash:
        raise ValueError("광고주 해시는 필수입니다.")

    if not body.amount:
        raise ValueError("광고 비용은 필수입니다.")

    if not body.start_date:
        raise ValueError("시작일은 필수입니다.")

    if not body.end_date:
        raise ValueError("종료일은 필수입니다.")

    if body.is_active not in ("Y", "N"):
        raise ValueError("활성 여부는 Y 또는 N 이어야 합니다.")

    if body.target_link and not body.target_link.startswith(("http://", "https://")):
        raise ValueError("유효한 URL이 아닙니다. http:// 또는 https://로 시작해야 합니다.")

    return {
        "advertiser_hash": body.advertiser_hash,
        "amount": body.amount,
        "start_date": body.start_date,
        "end_date": body.end_date,
        "contents": body.contents.strip() if body.contents else None,
        "target_link": body.target_link.strip() if body.target_link else None,
        "is_active": body.is_active,
    }

def set_ad_hash(advertiser_id, start_date, end_date, amount):
    """
    광고 해시 생성
    """
    raw = f"{advertiser_id}:{start_date}:{end_date}:{amount}"
    return hashlib.sha256(raw.encode()).hexdigest()

async def add_ads(db, body, image_files=None):
    """
    광고 추가
    """
    try:
        params = validate_body(body)
        params['view_hash'] = set_ad_hash(
            body.advertiser_hash,
            body.start_date,
            body.end_date,
            body.amount
        )

        exist_advertiser = AdvertiserRepository.get_advertiser_by_hash(db, body.advertiser_hash)
        if not exist_advertiser:
            raise ValueError("존재하지 않는 광고주입니다.")

        # advertiser_hash 는 unset
        params.pop('advertiser_hash', None)
        params['advertiser_id'] = exist_advertiser.id

        ad = AdsRepository.add(db, params)

        # 이미지는 최대 10개까지 업로드가 가능
        if image_files:
            for file in image_files[:10]:
                upload_result = await upload_file(ad.id, file, "Ads")
                if not upload_result:
                    return CommonResponse(success=False, message="파일 업로드 실패")

                # 업로드된 파일 정보를 DB에 저장
                await save_upload_file(db, "Ads", ad.id, upload_result)

        db.commit()
        return CommonResponse(success=True, message="광고가 성공적으로 추가되었습니다.")

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, message=str(e))
    except ValueError as ve:
        db.rollback()
        return CommonResponse(success=False, message=str(ve))

async def edit_ads(db, view_hash, body, image_files=None):
    """
    광고 수정
    """
    try:
        ad = AdsRepository.get_ad_by_hash(db, view_hash)
        if not ad:
            return CommonResponse(success=False, message="존재하지 않는 광고입니다.")

        params = validate_body(body)

        # advertiser_hash 는 unset
        params.pop('advertiser_hash', None)

        is_success = AdsRepository.modify(db, ad.id, params)
        if not is_success:
            raise Exception("광고 수정에 실패했습니다.")

        # 이미지 파일이 있는 경우 업로드 및 URL 저장
        if image_files:
            for file in image_files[:10]:
                upload_result = await upload_file(ad.id, file, "Ads")
                if not upload_result:
                    return CommonResponse(success=False, message="파일 업로드 실패")

                # 업로드된 파일 정보를 DB에 저장
                await save_upload_file(db, "Ads", ad.id, upload_result)

        db.commit()
        return CommonResponse(success=True, message="광고가 성공적으로 수정되었습니다.")

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, message=str(e))
    except ValueError as ve:
        db.rollback()
        return CommonResponse(success=False, message=str(ve))

def get_ads_list(db, body):
    """
    광고 리스트 조회
    """
    ads_list, total_count = AdsRepository.get_ads_list(db, body)

    list = []
    if total_count > 0:
        for ad, account_image, account_name, company, advertiser_view_hash, account_id, ad_images in ads_list:
            list.append({
                "id": ad.id,
                "advertiser_id": ad.advertiser_id,
                "amount": ad.amount,
                "start_date": ad.start_date,
                "end_date": ad.end_date,
                "target_link": ad.target_link,
                "is_active": ad.is_active,
                "contents": ad.contents,
                "click_count": ad.click_count,
                "view_hash": ad.view_hash,
                "account_image": account_image,
                "account_name": account_name,
                "company": company,
                "advertiser_view_hash": advertiser_view_hash,
                "account_id": account_id,
                "ad_images": ad_images.split(",") if ad_images else []
            })

    result = {
        "list": list,
        "total_count": total_count
    }

    return CommonResponse(success=True, data=result, message="광고 리스트 조회 성공")

async def click_ad(db, user_hash, view_hash, ip, user_agent):
    """
    광고 클릭 기록
    """
    from app.services.users_service import validate_user
    try:
        user = validate_user(db, user_hash)
        if not user:
            raise ValueError("존재하지 않는 사용자입니다.")

        ad = AdsRepository.get_ad_by_hash(db, view_hash)
        if not ad:
            raise ValueError("존재하지 않는 광고입니다.")

        # 클릭 수 증가
        new_click_count = ad.click_count + 1
        updated_ad = AdsRepository.set_click_count(db, ad.id, new_click_count)

        # 클릭 로그 저장
        add_log_result = AdsClicksLogsRepository.add_log(db, ad.id, user.id, ip, user_agent)
        if not updated_ad or not add_log_result:
            raise Exception("광고 클릭 기록에 실패했습니다.")

        db.commit()
        return CommonResponse(
            success=True,
            message="광고 링크로 이동합니다.",
            data={"target_link": updated_ad.target_link}
        )

    except ValueError as ve:
        return CommonResponse(success=False, message=str(ve))
    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, message=str(e))
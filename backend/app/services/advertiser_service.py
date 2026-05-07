from app.repository.advertisers_repository import AdvertiserRepository
from app.schemas.common_schemas import CommonResponse
import hashlib

from app.services.attaches_files_service import upload_file
from app.schemas.advertiser_schemas import AdvertiserItemSchema
from app.repository.ads_repository import AdsRepository

def set_advertiser_hash(db, company=str, company_number=str, account_id=str):
    """
    광고주 해시 생성
    """
    raw = f"{company}:{company_number}:{account_id}"
    return hashlib.sha256(raw.encode()).hexdigest()

def validate_body(body):
    """
    광고주 추가 요청 데이터 검증
    """
    if not body.company:
        raise ValueError("회사명은 필수입니다.")
    if not body.company_number:
        raise ValueError("사업자 등록번호는 필수입니다.")
    if not body.account_id:
        raise ValueError("계정 ID는 필수입니다.")
    if not body.account_email:
        raise ValueError("계정 이메일은 필수입니다.")

    return {
        "company": body.company,
        "company_number": body.company_number,
        "account_id": body.account_id,
        "account_name": body.account_name,
        "account_email": body.account_email if hasattr(body, 'account_email') else "",
        "account_tel": body.account_tel,
        "company_biz": body.company_biz if body.company_biz else "",
        "company_item": body.company_item if body.company_item else "",
        "description": body.description.strip() if body.description else ""
    }

async def add_advertiser(db, body, account_image_file=None):
    """
    광고주 추가
    """
    try:
        view_hash = set_advertiser_hash(db, body.company, body.company_number, body.account_id)
        exist = AdvertiserRepository.get_advertiser_by_hash(db, view_hash)

        if exist:
            return CommonResponse(success=False, message="이미 존재하는 광고주입니다.")

        params = validate_body(body)
        params['view_hash'] = view_hash

        advertiser = AdvertiserRepository.add(db, params)
        if not advertiser:
            raise Exception("광고주 추가에 실패했습니다.")

        # 이미지 파일이 있는 경우 업로드 및 URL 저장
        if account_image_file:
            image_result = await upload_file(advertiser.id, account_image_file, "Advertiser")
            if not image_result:
                raise Exception("광고주 이미지 등록에 실패했습니다.")

            is_success = AdvertiserRepository.modify(db, advertiser.id, {"account_image": image_result['image_url']})
            if not is_success:
                raise Exception("광고주 이미지 수정에 실패했습니다.")

        db.commit()
    except ValueError as ve:
        db.rollback()
        return CommonResponse(success=False, message=str(ve))

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, message=str(e))

    return CommonResponse(success=True, message="광고주가 성공적으로 추가되었습니다.")

async def delete_advertiser_image(advertiser):

    """
    광고주 이미지 삭제
    """
    import os
    from glob import glob

    try:
        # 기존 이미지가 있다면 삭제 처리
        if advertiser.account_image:
            BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            abs_base = os.path.join(BASE_DIR, advertiser.account_image.lstrip('/').replace('/', os.sep))

            matching_files = glob(abs_base + '_*.webp')

            if not matching_files:
                return None

            for file_path in matching_files:
                if not os.path.exists(file_path):
                    continue

                os.remove(file_path)
        return True
    except Exception as e:
        # 예외 처리 로직 (로그 기록 등)
        pass

async def edit_advertiser(db, view_hash, body, account_image_file=None):
    """
    광고주 수정
    """
    try:
        advertiser = AdvertiserRepository.get_advertiser_by_hash(db, view_hash)
        if not advertiser:
            raise ValueError("해당 해시를 가진 광고주가 존재하지 않습니다.")

        params = validate_body(body)

        # 이미지 파일이 있는 경우 업로드 및 URL 저장
        if account_image_file:

            # 기존에 등록된 이미지가 있다면 삭제 처리
            if advertiser.account_image:
                await delete_advertiser_image(advertiser)

            image_result = await upload_file(advertiser.id, account_image_file, "Advertiser")
            if not image_result:
                raise Exception("광고주 이미지 등록에 실패했습니다.")
            params['account_image'] = image_result['image_url']

        is_success = AdvertiserRepository.modify(db, advertiser.id, params)
        if not is_success:
            raise Exception("광고주 수정에 실패했습니다.")

        db.commit()
    except ValueError as ve:
        db.rollback()
        return CommonResponse(success=False, message=str(ve))

    except Exception as e:
        db.rollback()
        return CommonResponse(success=False, message=str(e))

    return CommonResponse(success=True, message="광고주가 성공적으로 수정되었습니다.")

def get_advertiser_list(db, params):
    rows = AdvertiserRepository.get_advertiser_list(db, params)
    serialized_list = []

    for advertiser, total_ad_amount in rows:
        serialized_list.append({
            "account_id": advertiser.account_id,
            "account_name": advertiser.account_name,
            "company": advertiser.company,
            "account_tel": advertiser.account_tel,
            "account_email": advertiser.account_email,
            "company_number": advertiser.company_number,
            "account_image": advertiser.account_image,
            "view_hash": advertiser.view_hash,
            "total_ad_amount": int(total_ad_amount or 0),
        })

    return CommonResponse(success=True, data=serialized_list, message="광고주 리스트 조회 성공")

def get_advertiser_hash(db, view_hash):
    """
    광고주 해시 조회
    """
    advertiser = AdvertiserRepository.get_advertiser_by_hash(db, view_hash)
    if not advertiser:
        return CommonResponse(success=False, message="해당 해시를 가진 광고주가 존재하지 않습니다.")

    data = AdvertiserItemSchema(
        account_id=advertiser.account_id,
        account_name=advertiser.account_name,
        company=advertiser.company,
        account_image=advertiser.account_image,
        account_tel=advertiser.account_tel,
        account_email=advertiser.account_email,
        company_number=advertiser.company_number,
        company_biz=advertiser.company_biz,
        company_item=advertiser.company_item,
        description=advertiser.description,
        view_hash=advertiser.view_hash
    )
    total_amount = AdsRepository.get_total_amount_by_advertiser_id(db, advertiser.id)

    # 광고의 광고 내역
    ads_data, total_count = AdsRepository.get_ads_list(db, {
        "advertiser_id": advertiser.id,
        "page": 1,
        "page_size": 1000
    })

    if total_count > 0:
        ads_data = [
            {
                "id": ad.id,
                "amount": ad.amount,
                "start_date": ad.start_date,
                "end_date": ad.end_date,
                "is_active": ad.is_active,
                "target_link": ad.target_link,
                "contents": ad.contents,
                "view_hash": ad.view_hash,
                "ad_images": ad_images.split(",") if ad_images else []
            }
            for ad, _, _, _, _, _, ad_images in ads_data
        ]


    result_data = {
        "account": data.dict(),
        "total_amount": total_amount,
        "ads": ads_data
    }

    return CommonResponse(success=True, data=result_data, message="광고주 해시 조회 성공")
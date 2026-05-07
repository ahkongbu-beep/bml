def AdvertiserListSerializer(advertiser, sum_amount=None):
    return {
        "account_id": advertiser.account_id,
        "account_name": advertiser.account_name,
        "company": advertiser.company,
        "company_number": advertiser.company_number,
        "account_image": advertiser.account_image,
        "view_hash": advertiser.view_hash
    }
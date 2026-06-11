export interface AdvertiserListItem {
  account_id: string;
  account_name: string;
  account_email: string;
  account_tel: string | null;
  company: string;
  company_number: string;
  account_image: string | null;
  view_hash: string;
  total_ad_amount: number;
}

export interface AdvertiserDetail extends AdvertiserListItem {
  company_biz?: string | null;
  account_email: string;
  company_item?: string | null;
  description?: string | null;
}

export interface AdvertiserSearchParams {
  account_id?: string;
  company?: string;
  company_number?: string;
  page?: number;
  page_size?: number;
}

export interface AdvertiserCreateParams {
  account_id: string;
  account_name: string;
  company: string;
  account_tel: string;
  company_number: string;
  description: string;
  company_biz?: string;
  company_item?: string;
  account_image?: File | null;
}

export interface AdvertiserEditParams extends AdvertiserCreateParams {
  view_hash: string;
}

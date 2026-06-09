export interface AdvsListItem {
	id: number;
	advertiser_id: number;
	amount: number;
	start_date: string;
	end_date: string;
	target_link?: string | null;
	is_active: "Y" | "N";
	contents?: string | null;
	click_count: number;
	view_hash: string;
	account_image?: string | null;
	account_name?: string | null;
	company?: string | null;
	advertiser_view_hash: string;
	account_id?: string | null;
	ad_images: string[];
}

export interface AdvsListResponse {
	list: AdvsListItem[];
	total_count: number;
}

export interface AdvsSearchParams {
	advertiser_id?: number;
	start_date?: string;
	end_date?: string;
	page?: number;
	page_size?: number;
}

export interface AdvsCreateParams {
	advertiser_hash: string;
	amount: number;
	start_date: string;
	end_date: string;
	target_link?: string;
	contents?: string;
	is_active?: "Y" | "N";
	image_files?: File[];
}

export interface AdvsEditParams extends AdvsCreateParams {
	view_hash: string;
}
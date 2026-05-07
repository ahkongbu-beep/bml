import { useState } from "react";
import { apiCall } from "@/libs/utils/apiHelper";
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter";
import { CommonResponse } from "@/libs/interface/common";
import {
  AdvertiserCreateParams,
  AdvertiserDetail,
  AdvertiserEditParams,
  AdvertiserListItem,
  AdvertiserSearchParams,
} from "@/libs/interface/advertisers";

export function useAdvertisers() {
  const [advertisers, setAdvertisers] = useState<AdvertiserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvertisers = async (params: AdvertiserSearchParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.account_id) queryParams.append("account_id", params.account_id);
      if (params.company) queryParams.append("company", params.company);
      if (params.company_number) queryParams.append("company_number", params.company_number);
      queryParams.append("page", String(params.page ?? 1));
      queryParams.append("page_size", String(params.page_size ?? 20));

      const apiUrl = `${FRONTEND_ROUTES.ADVERTISERS()}?${queryParams.toString()}`;
      const result = (await apiCall(apiUrl, "GET")) as CommonResponse<AdvertiserListItem[]>;

      if (!result.success) {
        throw new Error(result.error || result.message || "광고주 조회에 실패했습니다.");
      }

      const list = Array.isArray(result.data) ? result.data : [];
      setAdvertisers(list);
      return list;
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 조회에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvertiserDetail = async (viewHash: string) => {
    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${FRONTEND_ROUTES.ADVERTISERS()}?view_hash=${encodeURIComponent(viewHash)}`;
      const result = (await apiCall(apiUrl, "GET")) as CommonResponse<AdvertiserDetail>;

      if (!result.success || !result.data) {
        throw new Error(result.error || result.message || "광고주 상세 조회에 실패했습니다.");
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 상세 조회에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createAdvertiser = async (params: AdvertiserCreateParams) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("account_id", params.account_id);
      formData.append("account_name", params.account_name);
      formData.append("company", params.company);
      formData.append("account_tel", params.account_tel || "");
      formData.append("company_number", params.company_number);
      formData.append("description", params.description || "");

      if (params.company_biz) formData.append("company_biz", params.company_biz);
      if (params.company_item) formData.append("company_item", params.company_item);
      if (params.account_image) formData.append("account_image", params.account_image);

      const response = await fetch(FRONTEND_ROUTES.ADVERTISERS(), {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as CommonResponse<null>;

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "광고주 등록에 실패했습니다.");
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 등록에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editAdvertiser = async (params: AdvertiserEditParams) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("account_id", params.account_id);
      formData.append("account_name", params.account_name);
      formData.append("company", params.company);
      formData.append("account_tel", params.account_tel || "");
      formData.append("company_number", params.company_number);
      formData.append("description", params.description || "");

      if (params.company_biz) formData.append("company_biz", params.company_biz);
      if (params.company_item) formData.append("company_item", params.company_item);
      if (params.account_image) formData.append("account_image", params.account_image);

      const response = await fetch(
        `${FRONTEND_ROUTES.ADVERTISERS()}?view_hash=${encodeURIComponent(params.view_hash)}`,
        { method: "PUT", body: formData }
      );

      const result = (await response.json()) as CommonResponse<null>;

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "광고주 수정에 실패했습니다.");
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고주 수정에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    advertisers,
    loading,
    error,
    fetchAdvertisers,
    fetchAdvertiserDetail,
    createAdvertiser,
    editAdvertiser,
  };
}

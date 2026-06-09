import { useState } from "react";
import { apiCall } from "@/libs/utils/apiHelper";
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter";
import { CommonResponse } from "@/libs/interface/common";
import {
  AdvsCreateParams,
  AdvsEditParams,
  AdvsListItem,
  AdvsListResponse,
  AdvsSearchParams,
} from "@/libs/interface/ads";

export function useAds() {
  const [ads, setAds] = useState<AdvsListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAds = async (params: AdvsSearchParams = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.advertiser_id) queryParams.append("advertiser_id", String(params.advertiser_id));
      if (params.start_date) queryParams.append("start_date", params.start_date);
      if (params.end_date) queryParams.append("end_date", params.end_date);
      queryParams.append("page", String(params.page ?? 1));
      queryParams.append("page_size", String(params.page_size ?? 20));

      const apiUrl = `${FRONTEND_ROUTES.ADS()}?${queryParams.toString()}`;
      const result = (await apiCall(apiUrl, "GET")) as CommonResponse<AdvsListResponse>;

      if (!result.success) {
        throw new Error(result.error || result.message || "광고 조회에 실패했습니다.");
      }

      const list = Array.isArray(result.data?.list) ? result.data.list : [];
      const total = typeof result.data?.total_count === "number" ? result.data.total_count : list.length;

      setAds(list);
      setTotalCount(total);
      return list;
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고 조회에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createAd = async (params: AdvsCreateParams) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("advertiser_hash", params.advertiser_hash);
      formData.append("amount", String(params.amount));
      formData.append("start_date", params.start_date);
      formData.append("end_date", params.end_date);
      formData.append("target_link", params.target_link || "");
      formData.append("contents", params.contents || "");
      formData.append("is_active", params.is_active || "Y");

      for (const file of params.image_files || []) {
        formData.append("image_files", file);
      }

      const response = await fetch(FRONTEND_ROUTES.ADS(), {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as CommonResponse<null>;

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "광고 등록에 실패했습니다.");
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고 등록에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const editAd = async (params: AdvsEditParams) => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("advertiser_hash", params.advertiser_hash);
      formData.append("amount", String(params.amount));
      formData.append("start_date", params.start_date);
      formData.append("end_date", params.end_date);
      formData.append("target_link", params.target_link || "");
      formData.append("contents", params.contents || "");
      formData.append("is_active", params.is_active || "Y");

      for (const file of params.image_files || []) {
        formData.append("image_files", file);
      }

      const response = await fetch(
        `${FRONTEND_ROUTES.ADS()}?view_hash=${encodeURIComponent(params.view_hash)}`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const result = (await response.json()) as CommonResponse<null>;

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "광고 수정에 실패했습니다.");
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "광고 수정에 실패했습니다.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    ads,
    totalCount,
    loading,
    error,
    fetchAds,
    createAd,
    editAd,
  };
}

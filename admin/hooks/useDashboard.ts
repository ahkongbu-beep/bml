// @/hooks/useDashboard.ts
// 대시보드 관련 훅
// 관리자 페이지에서 사용
import { useState } from "react";
import { apiCall } from "@/libs/utils/apiHelper"
import { FRONTEND_ROUTES } from "@/libs/utils/apiRouter"
import { CommonResponse } from "@/libs/interface/common";
import { DashboardStats } from "@/libs/interface/dashboards";

export function useDashboard() {
  const [loading, setLoading] = useState(false);
  const [initStat, setInitStat] = useState<DashboardStats | null>(null);

  const fetchInitStat = async () => {
    try {
      setLoading(true);

      const apiURL = `${FRONTEND_ROUTES.DASHBOARD()}/init-stat`;
      const response = await apiCall(apiURL, 'GET') as CommonResponse<DashboardStats>;

      if (!response.success) {
        throw new Error(response.error || '피드 조회 실패');
      }

      if (response.data) {
        setInitStat(response.data);
      }

    } catch (error) {
      console.error("대시보드 초기 통계 조회 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    initStat,
    fetchInitStat,
  };
}
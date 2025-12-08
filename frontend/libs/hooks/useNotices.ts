import { useQuery } from '@tanstack/react-query';
import { fetchGet } from '../api/config';
import { Notice, NoticeDetail } from '../types/NoticeType';

/**
 * 공지사항 목록 조회 Hook
 */

export const useNotices = (status: string = 'active') => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notices', status],
    queryFn: async () => {
      const response = await fetchGet('/notices/list', { status });
      return response.data as Notice[];
    },
  });

  return {
    notices: data,
    isLoading,
    error,
    refetch,
  };
};

export const useNoticeDetail = (viewHash: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['notice', viewHash],
    queryFn: async () => {
      const response = await fetchGet(`/notices/detail/${viewHash}`);
      return response.data as NoticeDetail;
    },
    enabled: !!viewHash,
  });

  return {
    noticeDetail: data,
    isLoading,
    error,
  };
};

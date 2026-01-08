import { useQuery } from '@tanstack/react-query';
import { getSummaryList } from '../api/summariesApi';
import { SummaryListRequest } from '../types/SummariesType';

// Query Keys
export const summariesKeys = {
  all: ['summaries'] as const,
  search: (userHash: string, model: string) => [...summariesKeys.all, 'search', userHash, model] as const,
};

/**
 * ai 요역정보 조회 Hook
 */
export const useSummaries = ({userHash, model}: {userHash: string, model: string}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: summariesKeys.search(),
    queryFn: () => getSummaryList({userHash, model}),
    staleTime: 1000 * 60 * 30, // 30분
  });

  return {
    summaryData: data,
    isLoading,
    error,
    refetch,
  };
};
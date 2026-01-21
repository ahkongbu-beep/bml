import { useQuery } from '@tanstack/react-query';
import { getSummaryList } from '../api/summariesApi';
import { SummaryListRequest } from '../types/SummariesType';

// Query Keys
export const summariesKeys = {
  all: ['summaries'] as const,
  search: (model: string) => [...summariesKeys.all, 'search', model] as const,
};

/**
 * ai 요역정보 조회 Hook
 */
export const useSummaries = ({model}: {model: string}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: summariesKeys.search(model),
    queryFn: () => getSummaryList({model}),
    staleTime: 1000 * 60 * 30, // 30분
  });

  return {
    summaryData: data,
    isLoading,
    error,
    refetch,
  };
};
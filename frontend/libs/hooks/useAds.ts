import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { setAdClick } from '../api/adsApi';




export const useAdClick = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (view_hash: string) => setAdClick(view_hash),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ads', variables.view_hash] });
    },
  })
};

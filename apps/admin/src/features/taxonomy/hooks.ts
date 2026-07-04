import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/queryClient';
import { taxonomyApi } from './api';

export function useCategories() {
  return useQuery({
    queryKey: qk.categories,
    queryFn: taxonomyApi.listCategories,
    staleTime: 300_000,
  });
}

export function useRegions() {
  return useQuery({ queryKey: qk.regions, queryFn: taxonomyApi.listRegions, staleTime: 300_000 });
}

export function useBadges() {
  return useQuery({ queryKey: qk.badges, queryFn: taxonomyApi.listBadges, staleTime: 300_000 });
}

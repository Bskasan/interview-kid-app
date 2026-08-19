import { useQuery } from '@tanstack/react-query';
import { fetchLessons } from '@/api/lessons';

export function useLessons() {
  return useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
  });
}

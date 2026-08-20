/**
 * The Home list's server state: a React Query wrapper around fetchLessons,
 * cached (and offline-restored) under the 'lessons' key by the root provider.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchLessons } from '@/api/lessons';

export function useLessons() {
  return useQuery({
    queryKey: ['lessons'],
    queryFn: fetchLessons,
  });
}

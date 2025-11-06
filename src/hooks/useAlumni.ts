import { useQuery } from '@tanstack/react-query';
import type { AlumniRecord } from '@/types/alumni';
import { getAllAlumni } from '@/lib/alumniStore';

async function fetchAlumniRecords(): Promise<AlumniRecord[]> {
  return getAllAlumni();
}

export function useAlumni() {
  return useQuery({
    queryKey: ['alumni'],
    queryFn: fetchAlumniRecords,
    staleTime: 5 * 60 * 1000,
  });
}

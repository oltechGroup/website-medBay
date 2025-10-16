import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  created_at: string;
}

export const useManufacturers = () => {
  const { data: manufacturers = [], isLoading, error } = useQuery({
    queryKey: ['manufacturers'],
    queryFn: async (): Promise<Manufacturer[]> => {
      try {
        const response = await api.get('/manufacturers');
        return response.data;
      } catch (error) {
        console.error('Error fetching manufacturers:', error);
        throw error;
      }
    },
  });

  return {
    manufacturers,
    isLoading,
    error,
  };
};
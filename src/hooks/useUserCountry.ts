import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchUserCountry = async () => {
  const { data, error } = await supabase.functions.invoke('get-country');
  
  if (error) {
    console.error('Error fetching user country:', error);
    return 'US'; // Fallback to 'US' on error
  }
  
  return data.country || 'US';
};

export const useUserCountry = () => {
  return useQuery<string, Error>({
    queryKey: ['userCountry'],
    queryFn: fetchUserCountry,
    staleTime: Infinity, // Cache the country for the entire session
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2, // Retry up to 2 times on failure to improve reliability
  });
};
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AddressSuggestion {
  fullAddress: string;
  city: string;
  street: string;
  house: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const useAddressSuggestions = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["address-suggestions", query],
    queryFn: async () => {
      if (!query || query.trim().length < 3) {
        return { suggestions: [] as AddressSuggestion[] };
      }

      const { data, error } = await supabase.functions.invoke("suggest-address", {
        body: { query: query.trim() },
      });

      if (error) {
        console.error("Error fetching address suggestions:", error);
        return { suggestions: [] as AddressSuggestion[] };
      }

      return data as { suggestions: AddressSuggestion[] };
    },
    enabled: enabled && query.trim().length >= 3,
    staleTime: 60000, // Cache for 1 minute
  });
};
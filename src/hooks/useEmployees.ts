import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  full_name: string;
  phone: string | null;
  status: "available" | "busy" | "offline";
  current_location: { x: number; y: number } | null;
  current_task_id: string | null;
  created_at: string;
}

export const useEmployees = () => {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("full_name");

      if (error) throw error;
      return data as Employee[];
    },
  });
};

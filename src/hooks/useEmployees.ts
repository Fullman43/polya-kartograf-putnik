import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface CreateEmployeeData {
  email: string;
  full_name: string;
  phone?: string;
  password: string;
  role: "employee" | "operator" | "manager" | "client";
}

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeData: CreateEmployeeData) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Не авторизован");
      }

      const { data, error } = await supabase.functions.invoke("create-employee", {
        body: employeeData,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Не удалось создать сотрудника");
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

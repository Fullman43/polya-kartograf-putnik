import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  role: "employee" | "operator" | "manager" | "client" | "organization_admin";
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

export const useGetCurrentEmployee = () => {
  return useQuery({
    queryKey: ["current-employee"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Не авторизован");
      }

      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) throw error;
      return data as Employee;
    },
  });
};

export const useUpdateEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      employeeId, 
      status, 
      location 
    }: { 
      employeeId: string; 
      status: "available" | "busy" | "offline";
      location?: string;
    }) => {
      const updateData: any = { status };
      if (location) {
        updateData.current_location = location;
      }

      const { error } = await supabase
        .from("employees")
        .update(updateData)
        .eq("id", employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["current-employee"] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({
        title: "Успешно",
        description: "Сотрудник удален",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

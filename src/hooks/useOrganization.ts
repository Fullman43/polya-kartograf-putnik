import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  inn: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string | null;
  trial_ends_at: string;
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationData {
  name: string;
  inn: string;
  contact_person: string;
  contact_email: string;
  contact_phone?: string;
}

export const useOrganization = () => {
  return useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      console.log("useOrganization - fetching...");
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .maybeSingle();

      console.log("useOrganization - result:", { data, error });
      if (error) throw error;
      return data as Organization | null;
    },
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizationData) => {
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert(data)
        .select()
        .single();

      if (orgError) throw orgError;

      // Update current user's employee record with organization_id
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: empError } = await supabase
          .from("employees")
          .update({ organization_id: orgData.id })
          .eq("user_id", user.id);

        if (empError) throw empError;
      }

      return orgData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      queryClient.invalidateQueries({ queryKey: ["current-employee"] });
      toast.success("Организация успешно создана");
    },
    onError: (error: Error) => {
      toast.error("Ошибка при создании организации: " + error.message);
    },
  });
};

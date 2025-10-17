import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useTaskPhotos = (taskId: string) => {
  return useQuery({
    queryKey: ["task-photos", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_photos")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
};

export const useUploadTaskPhoto = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      // Get current session instead of calling getUser
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Ошибка проверки сессии");
      }
      
      if (!session?.user) {
        throw new Error("Необходимо войти в систему");
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${taskId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("task-photos")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("task-photos")
        .getPublicUrl(fileName);

      // Save photo record to database
      const { data, error } = await supabase
        .from("task_photos")
        .insert({
          task_id: taskId,
          photo_url: publicUrl,
          uploaded_by: session.user.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["task-photos", data.task_id] });
      toast({
        title: "Успешно",
        description: "Фото загружено",
      });
    },
    onError: (error) => {
      console.error("Upload photo error:", error);
      
      let errorMessage = "Не удалось загрузить фото";
      
      if (error.message.includes("session") || error.message.includes("Необходимо войти")) {
        errorMessage = "Сессия истекла. Пожалуйста, войдите снова";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Ошибка загрузки фото",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

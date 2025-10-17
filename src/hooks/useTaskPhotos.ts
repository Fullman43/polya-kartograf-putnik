import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TaskPhoto {
  id: string;
  task_id: string;
  photo_url: string;
  uploaded_by: string;
  created_at: string;
}

export const useTaskPhotos = (taskId: string) => {
  return useQuery({
    queryKey: ["task-photos", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      
      const { data, error } = await supabase
        .from("task_photos")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching task photos:', error);
        throw error;
      }
      
      console.log('Fetched photos for task', taskId, ':', data?.length || 0);
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

// Bulk upload multiple photos for a task
export const useUploadTaskPhotosBulk = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, files }: { taskId: string; files: File[] }) => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error("Необходимо войти в систему");
      }

      const userId = session.user.id;
      const uploadResults = [];

      // Upload all files in parallel
      for (const file of files) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}/${taskId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("task-photos")
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from("task-photos")
            .getPublicUrl(fileName);

          // Insert into database
          const { data, error } = await supabase
            .from("task_photos")
            .insert({
              task_id: taskId,
              photo_url: publicUrl,
              uploaded_by: userId,
            })
            .select()
            .single();

          if (error) throw error;
          
          uploadResults.push(data);
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      return uploadResults;
    },
    onSuccess: (data, variables) => {
      console.log('Successfully uploaded photos, invalidating cache for task:', variables.taskId);
      
      // Invalidate both the specific task photos and all tasks
      queryClient.invalidateQueries({ 
        queryKey: ["task-photos", variables.taskId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["task-photos"] 
      });
      
      toast({
        title: "Успешно",
        description: `Загружено фото: ${data.length} из ${variables.files.length}`,
      });
    },
    onError: (error) => {
      console.error("Bulk upload error:", error);
      toast({
        title: "Ошибка загрузки",
        description: error.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    },
  });
};

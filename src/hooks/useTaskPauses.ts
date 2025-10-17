import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TaskPause {
  id: string;
  task_id: string;
  paused_at: string;
  resumed_at: string | null;
  created_at: string;
}

// Получить все паузы для задачи
export const useTaskPauses = (taskId: string) => {
  return useQuery({
    queryKey: ["task-pauses", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_pauses")
        .select("*")
        .eq("task_id", taskId)
        .order("paused_at", { ascending: false });

      if (error) throw error;
      return data as TaskPause[];
    },
    enabled: !!taskId,
  });
};

// Поставить задачу на паузу
export const usePauseTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      // 1. Создать запись о паузе
      const { data: pauseData, error: pauseError } = await supabase
        .from("task_pauses")
        .insert({
          task_id: taskId,
          paused_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (pauseError) throw pauseError;

      // 2. Обновить статус задачи на 'paused'
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "paused" })
        .eq("id", taskId);

      if (taskError) throw taskError;

      return pauseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-pauses"] });
      toast({
        title: "Задача на паузе",
        description: "Рабочее время не учитывается",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Возобновить выполнение задачи
export const useResumeTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      // 1. Найти активную паузу (где resumed_at = NULL)
      const { data: activePause, error: findError } = await supabase
        .from("task_pauses")
        .select("*")
        .eq("task_id", taskId)
        .is("resumed_at", null)
        .order("paused_at", { ascending: false })
        .limit(1)
        .single();

      if (findError) throw new Error("Активная пауза не найдена");

      // 2. Закрыть паузу
      const { error: updateError } = await supabase
        .from("task_pauses")
        .update({ resumed_at: new Date().toISOString() })
        .eq("id", activePause.id);

      if (updateError) throw updateError;

      // 3. Вернуть статус задачи в 'in_progress'
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", taskId);

      if (taskError) throw taskError;

      return activePause;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-pauses"] });
      toast({
        title: "Работа возобновлена",
        description: "Рабочее время продолжает учитываться",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Функция для расчета общего времени на паузе (в минутах)
export const calculateTotalPauseTime = (pauses: TaskPause[]): number => {
  return pauses.reduce((total, pause) => {
    if (pause.resumed_at) {
      const pausedMs = new Date(pause.resumed_at).getTime() - new Date(pause.paused_at).getTime();
      return total + Math.round(pausedMs / (1000 * 60)); // в минутах
    }
    return total;
  }, 0);
};

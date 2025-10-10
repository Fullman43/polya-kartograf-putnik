import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Camera,
  MessageSquare,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";

const Employee = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const updateTask = useUpdateTask();
  
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || tasksLoading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  // Get the first in_progress or assigned task for this employee
  const currentTask = tasks?.find((task) => 
    (task.status === "in_progress" || task.status === "assigned")
  );
  
  const upcomingTasks = tasks?.filter((task) => 
    task.status === "assigned" && task.id !== currentTask?.id
  ).slice(0, 3);

  const handleStatusChange = async (newStatus: "in_progress" | "completed", label: string) => {
    if (!currentTask) return;
    
    await updateTask.mutateAsync({
      id: currentTask.id,
      status: newStatus,
      ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}),
    });
    
    toast({
      title: "Статус обновлён",
      description: label,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Мои задачи</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                На линии
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Выход"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {!currentTask ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Нет активных задач</p>
          </Card>
        ) : (
          <>
            {/* Current Task Card */}
            <Card className="p-6 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">{currentTask.work_type}</h2>
                  <div className="flex items-center text-muted-foreground text-sm mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{currentTask.address}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{new Date(currentTask.scheduled_time).toLocaleString("ru-RU")}</span>
                  </div>
                </div>
                <Badge className={
                  currentTask.status === "in_progress" ? "bg-warning" : "bg-info"
                }>
                  {currentTask.status === "in_progress" ? "В работе" : "Назначена"}
                </Badge>
              </div>

              {currentTask.description && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{currentTask.description}</p>
                </div>
              )}

              {/* Status Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Прогресс выполнения</span>
                  <span className="text-sm text-muted-foreground">
                    {currentTask.status === "assigned" && "0%"}
                    {currentTask.status === "in_progress" && "50%"}
                    {currentTask.status === "completed" && "100%"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      currentTask.status === "completed" ? "bg-success" : "bg-primary"
                    }`}
                    style={{ 
                      width: currentTask.status === "assigned" ? "0%" : 
                             currentTask.status === "in_progress" ? "50%" : "100%" 
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  disabled={currentTask.status !== "assigned"}
                  onClick={() => handleStatusChange("in_progress", "Работа начата")}
                >
                  <PlayCircle className="h-4 w-4" />
                  Начать работу
                </Button>

                <Button
                  className="w-full gap-2"
                  disabled={currentTask.status !== "in_progress"}
                  onClick={() => handleStatusChange("completed", "Задача выполнена")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Завершить
                </Button>
              </div>

              {/* Comments and Photo */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Комментарий
                  </label>
                  <Textarea
                    placeholder="Добавить примечание..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <Button variant="outline" className="w-full gap-2">
                  <Camera className="h-4 w-4" />
                  Добавить фото отчёт
                </Button>
              </div>
            </Card>
          </>
        )}

        {/* Upcoming Tasks */}
        {upcomingTasks && upcomingTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Предстоящие задачи</h3>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">{task.work_type}</p>
                      <div className="flex items-center text-muted-foreground text-xs mb-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{new Date(task.scheduled_time).toLocaleString("ru-RU")}</span>
                      </div>
                      <div className="flex items-start text-muted-foreground text-xs">
                        <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-1">{task.address}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Employee;

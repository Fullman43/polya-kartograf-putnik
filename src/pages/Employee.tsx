import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Camera,
  MessageSquare,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useGetCurrentEmployee, useUpdateEmployeeStatus } from "@/hooks/useEmployees";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const Employee = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: currentEmployee, isLoading: employeeLoading } = useGetCurrentEmployee();
  const updateTask = useUpdateTask();
  const updateEmployeeStatus = useUpdateEmployeeStatus();
  const queryClient = useQueryClient();
  
  const [comment, setComment] = useState("");
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"active" | "unavailable" | "loading">("loading");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Setup realtime subscriptions for tasks and employees
  useEffect(() => {
    const channel = supabase
      .channel('employee-page-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks' 
      }, () => {
        console.log('Task data changed - refreshing');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'employees' 
      }, () => {
        console.log('Employee data changed - refreshing');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Track employee location when available or busy
  useEffect(() => {
    if (!currentEmployee?.id) return;

    const startLocationTracking = () => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported");
        return;
      }

      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const location = `POINT(${longitude} ${latitude})`;
          
          setCurrentLocation({ latitude, longitude });
          setGpsStatus("active");

          // Update employee location in database
          try {
            await updateEmployeeStatus.mutateAsync({
              employeeId: currentEmployee.id,
              status: currentEmployee.status,
              location: location as any,
            });
          } catch (error) {
            console.error("Failed to update location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setGpsStatus("unavailable");
          toast({
            title: "Ошибка геолокации",
            description: "Не удалось получить ваше местоположение",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );

      setWatchId(id);
    };

    // Only track location when employee is available or busy
    if (currentEmployee.status === "available" || currentEmployee.status === "busy") {
      startLocationTracking();
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    };
  }, [currentEmployee?.id, currentEmployee?.status]);

  // Automatically set status to available on mount, offline on unmount
  useEffect(() => {
    if (currentEmployee?.id) {
      updateEmployeeStatus.mutate({ 
        employeeId: currentEmployee.id, 
        status: "available" 
      });

      return () => {
        updateEmployeeStatus.mutate({ 
          employeeId: currentEmployee.id, 
          status: "offline" 
        });
      };
    }
  }, [currentEmployee?.id]);

  if (loading || tasksLoading || employeeLoading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  // Filter tasks assigned to this employee only
  const myTasks = tasks?.filter((task) => 
    task.assigned_employee_id === currentEmployee?.id
  );

  // Get the first in_progress, en_route or assigned task for this employee
  const currentTask = myTasks?.find((task) => 
    (task.status === "in_progress" || task.status === "en_route" || task.status === "assigned")
  );
  
  const upcomingTasks = myTasks?.filter((task) => 
    task.status === "assigned" && task.id !== currentTask?.id
  ).slice(0, 3);

  const handleEnRoute = async () => {
    if (!currentTask || !currentEmployee || !currentLocation) return;
    
    await updateTask.mutateAsync({
      id: currentTask.id,
      status: "en_route",
      en_route_at: new Date().toISOString(),
    });

    await updateEmployeeStatus.mutateAsync({
      employeeId: currentEmployee.id,
      status: "busy"
    });
    
    toast({
      title: "Статус обновлён",
      description: "Вы в пути к заявке",
    });
  };

  const handleStatusChange = async (newStatus: "in_progress" | "completed", label: string) => {
    if (!currentTask || !currentEmployee) return;
    
    const updates: any = {
      id: currentTask.id,
      status: newStatus,
    };
    
    if (newStatus === "in_progress") {
      updates.started_at = new Date().toISOString();
    } else if (newStatus === "completed") {
      updates.completed_at = new Date().toISOString();
    }
    
    await updateTask.mutateAsync(updates);

    // Update employee status based on task status
    if (newStatus === "in_progress") {
      await updateEmployeeStatus.mutateAsync({
        employeeId: currentEmployee.id,
        status: "busy"
      });
    } else if (newStatus === "completed") {
      // Check if there are other active tasks
      const hasOtherActiveTasks = tasks?.some(
        t => t.id !== currentTask.id && (t.status === "in_progress" || t.status === "en_route" || t.status === "assigned")
      );
      
      await updateEmployeeStatus.mutateAsync({
        employeeId: currentEmployee.id,
        status: hasOtherActiveTasks ? "busy" : "available"
      });
    }
    
    toast({
      title: "Статус обновлён",
      description: label,
    });
  };

  const handleEmployeeStatusChange = async (status: "available" | "busy" | "offline") => {
    if (!currentEmployee) return;

    await updateEmployeeStatus.mutateAsync({
      employeeId: currentEmployee.id,
      status
    });

    const statusLabels = {
      available: "Доступен",
      busy: "Занят",
      offline: "Оффлайн"
    };

    toast({
      title: "Статус изменён",
      description: statusLabels[status],
    });
  };

  const getStatusBadge = (status: "available" | "busy" | "offline") => {
    const statusConfig = {
      available: { label: "Доступен", variant: "default" as const, className: "bg-success hover:bg-success" },
      busy: { label: "Занят", variant: "default" as const, className: "bg-warning hover:bg-warning" },
      offline: { label: "Оффлайн", variant: "secondary" as const, className: "" }
    };
    
    return statusConfig[status];
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
            <div className="flex items-center gap-3">
              {/* GPS Status */}
              <div className="flex items-center gap-2 text-xs">
                {gpsStatus === "active" && (
                  <>
                    <span className="h-2 w-2 bg-success rounded-full animate-pulse" />
                    <span className="text-muted-foreground">GPS активен</span>
                  </>
                )}
                {gpsStatus === "unavailable" && (
                  <>
                    <span className="h-2 w-2 bg-destructive rounded-full" />
                    <span className="text-muted-foreground">GPS недоступен</span>
                  </>
                )}
                {gpsStatus === "loading" && (
                  <>
                    <span className="h-2 w-2 bg-warning rounded-full animate-pulse" />
                    <span className="text-muted-foreground">Определение...</span>
                  </>
                )}
              </div>
              
              {currentEmployee && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant={getStatusBadge(currentEmployee.status).variant}
                      size="sm"
                      className={`gap-1 ${getStatusBadge(currentEmployee.status).className}`}
                    >
                      {getStatusBadge(currentEmployee.status).label}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEmployeeStatusChange("available")}>
                      🟢 Доступен
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEmployeeStatusChange("busy")}>
                      🟡 Занят
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEmployeeStatusChange("offline")}>
                      ⚫ Оффлайн
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
                  currentTask.status === "in_progress" ? "bg-warning" : 
                  currentTask.status === "en_route" ? "bg-info" : "bg-secondary"
                }>
                  {currentTask.status === "in_progress" ? "В работе" : 
                   currentTask.status === "en_route" ? "В пути" : "Назначена"}
                </Badge>
              </div>

              {currentTask.description && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{currentTask.description}</p>
                </div>
              )}

              {/* Current Location */}
              {currentLocation && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium mb-1">📍 Ваше местоположение</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span>Широта: </span>
                          <span className="font-mono">{currentLocation.latitude.toFixed(6)}</span>
                        </div>
                        <div>
                          <span>Долгота: </span>
                          <span className="font-mono">{currentLocation.longitude.toFixed(6)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Прогресс выполнения</span>
                  <span className="text-sm text-muted-foreground">
                    {currentTask.status === "assigned" && "0%"}
                    {currentTask.status === "en_route" && "33%"}
                    {currentTask.status === "in_progress" && "66%"}
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
                             currentTask.status === "en_route" ? "33%" :
                             currentTask.status === "in_progress" ? "66%" : "100%" 
                    }}
                  />
                </div>
                
                {/* Visual Steps */}
                <div className="flex items-center justify-between mt-3 text-xs">
                  <div className={`flex items-center gap-1 ${currentTask.status === "assigned" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    <div className={`h-2 w-2 rounded-full ${currentTask.status === "assigned" ? "bg-primary" : "bg-muted-foreground"}`} />
                    Назначена
                  </div>
                  <div className={`flex items-center gap-1 ${currentTask.status === "en_route" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    <div className={`h-2 w-2 rounded-full ${currentTask.status === "en_route" ? "bg-primary" : "bg-muted-foreground"}`} />
                    В пути
                  </div>
                  <div className={`flex items-center gap-1 ${currentTask.status === "in_progress" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    <div className={`h-2 w-2 rounded-full ${currentTask.status === "in_progress" ? "bg-primary" : "bg-muted-foreground"}`} />
                    На месте
                  </div>
                  <div className={`flex items-center gap-1 ${currentTask.status === "completed" ? "text-success font-medium" : "text-muted-foreground"}`}>
                    <div className={`h-2 w-2 rounded-full ${currentTask.status === "completed" ? "bg-success" : "bg-muted-foreground"}`} />
                    Завершена
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-4">
                {/* En Route Button */}
                {currentTask.status === "assigned" && (
                  <Button
                    variant="default"
                    className="w-full gap-2"
                    disabled={!currentLocation}
                    onClick={handleEnRoute}
                  >
                    <MapPin className="h-4 w-4" />
                    В пути на заявку
                  </Button>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={currentTask.status !== "en_route"}
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

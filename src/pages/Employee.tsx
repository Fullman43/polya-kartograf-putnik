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
import { useCreateComment } from "@/hooks/useTaskComments";
import { useUploadTaskPhoto } from "@/hooks/useTaskPhotos";
import { Input } from "@/components/ui/input";
import { TelegramSettings } from "@/components/employee/TelegramSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { PullToRefresh } from "@/components/PullToRefresh";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell, BellOff } from "lucide-react";

const Employee = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: currentEmployee, isLoading: employeeLoading } = useGetCurrentEmployee();
  const updateTask = useUpdateTask();
  const updateEmployeeStatus = useUpdateEmployeeStatus();
  const queryClient = useQueryClient();
  const createComment = useCreateComment();
  const uploadPhoto = useUploadTaskPhoto();
  const { permission, requestPermission, subscription } = usePushNotifications();
  
  const [comments, setComments] = useState<Record<string, string>>({});
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"active" | "unavailable" | "loading">("loading");
  const [taskFilter, setTaskFilter] = useState<"active" | "completed" | "pending">("active");

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
          const location = `(${longitude},${latitude})`;
          
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

  // Filter tasks based on selected filter
  const getFilteredTasks = () => {
    if (!myTasks) return [];
    
    switch (taskFilter) {
      case "active":
        return myTasks.filter(task => 
          task.status === "assigned" || task.status === "en_route" || task.status === "in_progress"
        );
      case "completed":
        return myTasks.filter(task => task.status === "completed");
      case "pending":
        return myTasks.filter(task => task.status === "pending");
      default:
        return myTasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  // Translation function for work types
  const translateWorkType = (workType: string): string => {
    const translations: Record<string, string> = {
      'repair': 'Ремонт',
      'diagnostics': 'Диагностика',
      'installation': 'Установка',
      'mounting': 'Монтаж',
      'maintenance': 'Обслуживание',
      'consultation': 'Консультация',
      'inspection': 'Осмотр'
    };
    return translations[workType.toLowerCase()] || workType;
  };

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

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    ]);
  };

  const handleToggleNotifications = async () => {
    if (permission === 'granted') {
      toast({
        title: 'Уведомления включены',
        description: 'Push-уведомления уже активированы',
      });
    } else {
      await requestPermission();
    }
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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-muted/30">
        {/* Offline Indicator */}
        <OfflineIndicator />
        
        {/* PWA Install Banner */}
        <PWAInstallBanner />
        
        {/* Header */}
        <header className="bg-card border-b sticky top-0 z-10 shadow-card">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Мои задачи</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* GPS Status */}
                <div className="flex items-center gap-2 text-xs">
                  {gpsStatus === "active" && (
                    <>
                      <span className="h-2 w-2 bg-success rounded-full animate-pulse" />
                      <span className="text-muted-foreground hidden sm:inline">GPS активен</span>
                    </>
                  )}
                  {gpsStatus === "unavailable" && (
                    <>
                      <span className="h-2 w-2 bg-destructive rounded-full" />
                      <span className="text-muted-foreground hidden sm:inline">GPS недоступен</span>
                    </>
                  )}
                  {gpsStatus === "loading" && (
                    <>
                      <span className="h-2 w-2 bg-warning rounded-full animate-pulse" />
                      <span className="text-muted-foreground hidden sm:inline">Определение...</span>
                    </>
                  )}
                </div>
                
                {/* Push Notifications Toggle */}
                <Button
                  variant={permission === 'granted' ? 'ghost' : 'outline'}
                  size="icon"
                  onClick={handleToggleNotifications}
                  title={permission === 'granted' ? 'Уведомления включены' : 'Включить уведомления'}
                  className="h-8 w-8"
                >
                  {permission === 'granted' ? (
                    <Bell className="h-4 w-4 text-primary" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>
                
                {currentEmployee && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant={getStatusBadge(currentEmployee.status).variant}
                        size="sm"
                        className={`gap-1 ${getStatusBadge(currentEmployee.status).className}`}
                      >
                        <span className="hidden sm:inline">{getStatusBadge(currentEmployee.status).label}</span>
                        <span className="sm:hidden">
                          {currentEmployee.status === 'available' && '🟢'}
                          {currentEmployee.status === 'busy' && '🟡'}
                          {currentEmployee.status === 'offline' && '⚫'}
                        </span>
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
                  className="h-8 w-8"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-6 mt-6">
            {/* Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={taskFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setTaskFilter("active")}
            className="whitespace-nowrap"
          >
            Активные задачи
          </Button>
          <Button
            variant={taskFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setTaskFilter("completed")}
            className="whitespace-nowrap"
          >
            Завершенные задачи
          </Button>
          <Button
            variant={taskFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setTaskFilter("pending")}
            className="whitespace-nowrap"
          >
            Ожидают назначения
          </Button>
            </div>

            {filteredTasks.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              {taskFilter === "active" && "Нет активных задач"}
              {taskFilter === "completed" && "Нет завершенных задач"}
              {taskFilter === "pending" && "Нет задач в ожидании"}
            </p>
              </Card>
            ) : (
              <div className="space-y-3">
            {filteredTasks.map((task) => {
              const isCurrentTask = currentTask?.id === task.id;
              
              return (
                <Card key={task.id} className={`p-6 shadow-card ${isCurrentTask ? "border-primary border-2" : ""}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold mb-1">{translateWorkType(task.work_type)}</h2>
                      <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{task.address}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground text-sm mb-2">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{new Date(task.scheduled_time).toLocaleString("ru-RU")}</span>
                      </div>
                      {task.customer_name && (
                        <div className="flex items-center text-muted-foreground text-sm mb-1">
                          <span className="mr-1">👤</span>
                          <span>{task.customer_name}</span>
                        </div>
                      )}
                      {task.customer_phone && (
                        <div className="flex items-center text-muted-foreground text-sm">
                          <span className="mr-1">📞</span>
                          <a href={`tel:${task.customer_phone}`} className="hover:text-primary hover:underline">
                            {task.customer_phone}
                          </a>
                        </div>
                      )}
                    </div>
                    <Badge className={
                      task.status === "in_progress" ? "bg-warning" : 
                      task.status === "en_route" ? "bg-info" : 
                      task.status === "completed" ? "bg-success" :
                      task.status === "pending" ? "bg-secondary" : "bg-secondary"
                    }>
                      {task.status === "in_progress" ? "В работе" : 
                       task.status === "en_route" ? "В пути" : 
                       task.status === "completed" ? "Завершена" :
                       task.status === "pending" ? "Ожидает" : "Назначена"}
                    </Badge>
                  </div>

                  {task.description && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm">{task.description}</p>
                    </div>
                  )}

                  {/* Show controls only for current active task */}
                  {isCurrentTask && taskFilter === "active" && (
                    <>
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
                            {task.status === "assigned" && "0%"}
                            {task.status === "en_route" && "33%"}
                            {task.status === "in_progress" && "66%"}
                            {task.status === "completed" && "100%"}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              task.status === "completed" ? "bg-success" : "bg-primary"
                            }`}
                            style={{ 
                              width: task.status === "assigned" ? "0%" : 
                                     task.status === "en_route" ? "33%" :
                                     task.status === "in_progress" ? "66%" : "100%" 
                            }}
                          />
                        </div>
                        
                        {/* Visual Steps */}
                        <div className="flex items-center justify-between mt-3 text-xs">
                          <div className={`flex items-center gap-1 ${task.status === "assigned" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            <div className={`h-2 w-2 rounded-full ${task.status === "assigned" ? "bg-primary" : "bg-muted-foreground"}`} />
                            Назначена
                          </div>
                          <div className={`flex items-center gap-1 ${task.status === "en_route" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            <div className={`h-2 w-2 rounded-full ${task.status === "en_route" ? "bg-primary" : "bg-muted-foreground"}`} />
                            В пути
                          </div>
                          <div className={`flex items-center gap-1 ${task.status === "in_progress" ? "text-primary font-medium" : "text-muted-foreground"}`}>
                            <div className={`h-2 w-2 rounded-full ${task.status === "in_progress" ? "bg-primary" : "bg-muted-foreground"}`} />
                            На месте
                          </div>
                          <div className={`flex items-center gap-1 ${task.status === "completed" ? "text-success font-medium" : "text-muted-foreground"}`}>
                            <div className={`h-2 w-2 rounded-full ${task.status === "completed" ? "bg-success" : "bg-muted-foreground"}`} />
                            Завершена
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3 mb-4">
                        {/* En Route Button */}
                        {task.status === "assigned" && (
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
                            disabled={task.status !== "en_route"}
                            onClick={() => handleStatusChange("in_progress", "Работа начата")}
                          >
                            <PlayCircle className="h-4 w-4" />
                            Начать работу
                          </Button>

                          <Button
                            className="w-full gap-2"
                            disabled={task.status !== "in_progress"}
                            onClick={() => handleStatusChange("completed", "Задача выполнена")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Завершить
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Comments and Photos - available for all tasks */}
                  <div className="space-y-3 mt-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        <MessageSquare className="h-4 w-4 inline mr-1" />
                        Комментарий
                      </label>
                      <Textarea
                        placeholder="Добавить примечание..."
                        value={comments[task.id] || ""}
                        onChange={(e) => setComments(prev => ({ ...prev, [task.id]: e.target.value }))}
                        rows={3}
                        className="resize-none"
                      />
                      <Button 
                        variant="outline" 
                        className="w-full gap-2 mt-2"
                        disabled={!comments[task.id]?.trim() || createComment.isPending}
                        onClick={async () => {
                          const currentComment = comments[task.id]?.trim();
                          if (!task || !currentComment) return;
                          await createComment.mutateAsync({
                            taskId: task.id,
                            comment: currentComment,
                          });
                          setComments(prev => ({ ...prev, [task.id]: "" }));
                        }}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {createComment.isPending ? "Отправка..." : "Отправить комментарий"}
                      </Button>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        <Camera className="h-4 w-4 inline mr-1" />
                        Фото отчёт
                      </label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !task) return;
                          
                          await uploadPhoto.mutateAsync({
                            taskId: task.id,
                            file,
                          });
                          e.target.value = "";
                        }}
                        disabled={uploadPhoto.isPending}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="telegram" className="mt-6">
            <TelegramSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </PullToRefresh>
  );
};

export default Employee;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Clock, User, Phone, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { TaskDetailsDialog } from "@/components/dashboard/TaskDetailsDialog";
import type { Task } from "@/hooks/useTasks";
import { translateWorkType } from "@/lib/utils";

const Tasks = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: tasks } = useTasks();
  const { data: employees } = useEmployees();
  const updateTask = useUpdateTask();
  const [filter, setFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Setup realtime subscriptions for tasks and employees
  useEffect(() => {
    const channel = supabase
      .channel('tasks-page-updates')
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
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'task_comments' 
      }, () => {
        console.log('Comments changed - refreshing');
        queryClient.invalidateQueries({ queryKey: ['task-comments'] });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'task_photos' 
      }, () => {
        console.log('Photos changed - refreshing');
        queryClient.invalidateQueries({ queryKey: ['task-photos'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Ожидает</Badge>;
      case "assigned":
        return <Badge className="bg-blue-500">Назначена</Badge>;
      case "en_route":
        return <Badge className="bg-primary">В пути</Badge>;
      case "in_progress":
        return <Badge className="bg-warning">В процессе</Badge>;
      case "completed":
        return <Badge className="bg-success">Выполнена</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Отменена</Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline">Низкий</Badge>;
      case "medium":
        return <Badge variant="outline">Средний</Badge>;
      case "high":
        return <Badge variant="destructive">Высокий</Badge>;
      default:
        return null;
    }
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Не назначен";
    const employee = employees?.find((e) => e.id === employeeId);
    return employee?.full_name || "Неизвестно";
  };

  const handleAssignEmployee = async (taskId: string, employeeId: string) => {
    await updateTask.mutateAsync({
      id: taskId,
      assigned_employee_id: employeeId,
      status: "assigned",
    });
  };

  const filteredTasks = tasks?.filter(task => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Все задачи</h1>
            <p className="text-muted-foreground">Управление и назначение задач</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Фильтр" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все задачи</SelectItem>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="assigned">Назначена</SelectItem>
              <SelectItem value="en_route">В пути</SelectItem>
              <SelectItem value="in_progress">В процессе</SelectItem>
              <SelectItem value="completed">Выполнена</SelectItem>
              <SelectItem value="cancelled">Отменена</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4">
          {filteredTasks?.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {translateWorkType(task.work_type)}
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </CardTitle>
                    <CardDescription>Заявка №{task.order_number}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <span>{task.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(task.scheduled_time).toLocaleString("ru-RU")}</span>
                  </div>
                  {task.customer_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{task.customer_name}</span>
                    </div>
                  )}
                  {task.customer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{task.customer_phone}</span>
                    </div>
                  )}
                  {task.description && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {task.description}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm flex-1">
                    <span className="text-muted-foreground">Исполнитель:</span>
                    <span className="font-medium">{getEmployeeName(task.assigned_employee_id)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTask(task);
                      setDetailsDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Подробнее
                  </Button>
                  {task.status !== "completed" && task.status !== "cancelled" && (
                    <Select
                      value={task.assigned_employee_id || ""}
                      onValueChange={(value) => handleAssignEmployee(task.id, value)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Назначить сотрудника" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!filteredTasks || filteredTasks.length === 0) && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Задачи не найдены</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TaskDetailsDialog
        task={selectedTask}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </Layout>
  );
};

export default Tasks;
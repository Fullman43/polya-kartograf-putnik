import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";

const TaskListReal = () => {
  const { data: tasks, isLoading } = useTasks();
  const { data: employees } = useEmployees();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            Ожидает
          </Badge>
        );
      case "assigned":
        return (
          <Badge className="bg-info text-xs">
            Назначена
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-warning text-xs">
            В процессе
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-success text-xs">
            Выполнена
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="text-xs">
            Отменена
          </Badge>
        );
      default:
        return null;
    }
  };

  const getEmployeeName = (employeeId: string | null) => {
    if (!employeeId) return "Не назначен";
    const employee = employees?.find((e) => e.id === employeeId);
    return employee?.full_name || "Неизвестно";
  };

  if (isLoading) {
    return (
      <ScrollArea className="flex-1 px-4">
        <div className="p-4 text-sm text-sidebar-foreground/70">Загрузка...</div>
      </ScrollArea>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <ScrollArea className="flex-1 px-4">
        <div className="p-4 text-sm text-sidebar-foreground/70">Нет активных задач</div>
      </ScrollArea>
    );
  }

  const activeTasks = tasks.filter((task) => 
    task.status !== "completed" && task.status !== "cancelled"
  );

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-2 pb-4">
        {activeTasks.map((task) => (
          <div
            key={task.id}
            className="p-3 bg-sidebar-accent rounded-lg cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-sidebar-foreground">
                    {task.work_type}
                  </span>
                  {getStatusBadge(task.status)}
                </div>
                <div className="flex items-start gap-2 text-xs text-sidebar-foreground/70 mb-1">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{task.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{new Date(task.scheduled_time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {task.assigned_employee_id && (
                  <div className="text-xs text-sidebar-foreground/70 mt-1">
                    Исполнитель: {getEmployeeName(task.assigned_employee_id)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TaskListReal;

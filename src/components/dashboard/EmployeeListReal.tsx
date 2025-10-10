import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Clock } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";

const EmployeeListReal = () => {
  const { data: employees, isLoading } = useEmployees();
  const { data: tasks } = useTasks();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "busy":
        return (
          <Badge className="bg-success text-xs">
            Занят
          </Badge>
        );
      case "available":
        return (
          <Badge variant="outline" className="text-xs">
            Свободен
          </Badge>
        );
      case "offline":
        return (
          <Badge variant="secondary" className="text-xs">
            Офлайн
          </Badge>
        );
      default:
        return null;
    }
  };

  const getEmployeeTask = (employeeId: string) => {
    return tasks?.find((task) => task.assigned_employee_id === employeeId);
  };

  if (isLoading) {
    return (
      <ScrollArea className="flex-1 px-4">
        <div className="p-4 text-sm text-sidebar-foreground/70">Загрузка...</div>
      </ScrollArea>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <ScrollArea className="flex-1 px-4">
        <div className="p-4 text-sm text-sidebar-foreground/70">Нет сотрудников</div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-2 pb-4">
        {employees.map((employee) => {
          const currentTask = getEmployeeTask(employee.id);
          return (
            <div
              key={employee.id}
              className="p-3 bg-sidebar-accent rounded-lg cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-sidebar-foreground">
                    {employee.full_name}
                  </span>
                </div>
                {getStatusBadge(employee.status)}
              </div>

              {currentTask && (
                <div className="ml-10 space-y-1">
                  <div className="flex items-start gap-2 text-xs text-sidebar-foreground/70">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{currentTask.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(currentTask.scheduled_time).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default EmployeeListReal;

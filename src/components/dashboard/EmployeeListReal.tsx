import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Clock } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import { useMapContext } from "@/contexts/MapContext";

const EmployeeListReal = () => {
  const { data: employees, isLoading } = useEmployees();
  const { data: tasks } = useTasks();
  const { focusOnEmployee } = useMapContext();

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
              className="p-3 bg-card rounded-lg cursor-pointer hover:bg-accent transition-colors border border-border"
              onClick={() => focusOnEmployee(employee.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {employee.full_name}
                  </span>
                </div>
                {getStatusBadge(employee.status)}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default EmployeeListReal;

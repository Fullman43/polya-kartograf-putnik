import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Clock } from "lucide-react";

const EmployeeList = () => {
  const employees = [
    {
      id: "1",
      name: "Алексей Михайлов",
      status: "working",
      currentTask: "ул. Ленина, 45",
      eta: "10 мин",
    },
    {
      id: "2",
      name: "Дмитрий Козлов",
      status: "transit",
      currentTask: "пр. Мира, 234",
      eta: "25 мин",
    },
    {
      id: "3",
      name: "Сергей Волков",
      status: "working",
      currentTask: "ул. Пушкина, 10",
      eta: null,
    },
    {
      id: "4",
      name: "Иван Петров",
      status: "available",
      currentTask: null,
      eta: null,
    },
    {
      id: "5",
      name: "Павел Смирнов",
      status: "working",
      currentTask: "ул. Чехова, 89",
      eta: null,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "working":
        return (
          <Badge className="bg-success text-xs">
            Работает
          </Badge>
        );
      case "transit":
        return (
          <Badge className="bg-warning text-xs">
            В пути
          </Badge>
        );
      case "available":
        return (
          <Badge variant="outline" className="text-xs">
            Свободен
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-2 pb-4">
        {employees.map((employee) => (
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
                  {employee.name}
                </span>
              </div>
              {getStatusBadge(employee.status)}
            </div>

            {employee.currentTask && (
              <div className="ml-10 space-y-1">
                <div className="flex items-start gap-2 text-xs text-sidebar-foreground/70">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{employee.currentTask}</span>
                </div>
                {employee.eta && (
                  <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Прибытие через {employee.eta}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default EmployeeList;

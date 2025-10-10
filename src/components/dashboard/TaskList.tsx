import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User } from "lucide-react";

const TaskList = () => {
  const tasks = [
    {
      id: "1",
      address: "ул. Ленина, д. 45",
      type: "Установка",
      time: "14:00",
      employee: "Алексей М.",
      status: "active",
    },
    {
      id: "2",
      address: "пр. Мира, д. 234",
      type: "Ремонт",
      time: "16:30",
      employee: "Дмитрий К.",
      status: "assigned",
    },
    {
      id: "3",
      address: "ул. Пушкина, д. 10",
      type: "Диагностика",
      time: "15:15",
      employee: "Сергей В.",
      status: "active",
    },
    {
      id: "4",
      address: "ул. Гоголя, д. 78",
      type: "Настройка",
      time: "17:00",
      employee: null,
      status: "new",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-xs">Активна</Badge>;
      case "assigned":
        return <Badge variant="secondary" className="text-xs">Назначена</Badge>;
      case "new":
        return <Badge variant="outline" className="text-xs">Новая</Badge>;
      default:
        return null;
    }
  };

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-2 pb-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 bg-sidebar-accent rounded-lg cursor-pointer hover:bg-sidebar-accent/80 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-sidebar-foreground">{task.type}</span>
              {getStatusBadge(task.status)}
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-start gap-2 text-xs text-sidebar-foreground/70">
                <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{task.address}</span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                <Clock className="h-3.5 w-3.5" />
                <span>{task.time}</span>
              </div>
              
              {task.employee && (
                <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
                  <User className="h-3.5 w-3.5" />
                  <span>{task.employee}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TaskList;

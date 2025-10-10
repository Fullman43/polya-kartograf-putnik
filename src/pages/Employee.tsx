import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  Navigation,
  Camera,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";

const Employee = () => {
  const [status, setStatus] = useState<string>("assigned");
  const [comment, setComment] = useState("");

  const handleStatusChange = (newStatus: string, label: string) => {
    setStatus(newStatus);
    toast.success(`Статус обновлён: ${label}`);
  };

  const mockTask = {
    id: "1",
    address: "ул. Ленина, д. 45, кв. 12",
    type: "Установка оборудования",
    description: "Установка и настройка WiFi роутера",
    time: "14:00 - 16:00",
    client: "Иванов Пётр Сергеевич",
    phone: "+7 (999) 123-45-67",
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Мои задачи</h1>
              <p className="text-sm text-muted-foreground">Техник: Алексей М.</p>
            </div>
            <Badge variant="outline" className="text-sm">
              На линии
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Current Task */}
        <Card className="p-6 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">{mockTask.type}</h2>
              <p className="text-sm text-muted-foreground">{mockTask.description}</p>
            </div>
            <Badge className="bg-primary">Активная</Badge>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">{mockTask.address}</p>
                <Button variant="link" className="h-auto p-0 text-primary" size="sm">
                  <Navigation className="h-4 w-4 mr-1" />
                  Построить маршрут
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm">{mockTask.time}</p>
            </div>

            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{mockTask.client}</p>
                <p className="text-sm text-muted-foreground">{mockTask.phone}</p>
              </div>
            </div>
          </div>

          {/* Status Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Прогресс выполнения</span>
              <span className="text-sm text-muted-foreground">
                {status === "assigned" && "Назначено"}
                {status === "departed" && "В пути"}
                {status === "arrived" && "На месте"}
                {status === "working" && "Работа"}
                {status === "completed" && "Завершено"}
              </span>
            </div>
            <div className="flex gap-2">
              <div className={`h-2 flex-1 rounded ${status !== "assigned" ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 flex-1 rounded ${status !== "assigned" && status !== "departed" ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 flex-1 rounded ${status === "working" || status === "completed" ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 flex-1 rounded ${status === "completed" ? "bg-primary" : "bg-muted"}`} />
            </div>
          </div>

          {/* Status Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button 
              size="lg"
              variant={status === "departed" ? "default" : "outline"}
              className="gap-2"
              onClick={() => handleStatusChange("departed", "Выехал")}
              disabled={status !== "assigned"}
            >
              <Navigation className="h-5 w-5" />
              Выехал
            </Button>

            <Button 
              size="lg"
              variant={status === "arrived" ? "default" : "outline"}
              className="gap-2"
              onClick={() => handleStatusChange("arrived", "Прибыл")}
              disabled={status !== "departed"}
            >
              <MapPin className="h-5 w-5" />
              Прибыл
            </Button>

            <Button 
              size="lg"
              variant={status === "working" ? "default" : "outline"}
              className="gap-2"
              onClick={() => handleStatusChange("working", "Начал работу")}
              disabled={status !== "arrived"}
            >
              <PlayCircle className="h-5 w-5" />
              Начал работу
            </Button>

            <Button 
              size="lg"
              variant={status === "completed" ? "default" : "outline"}
              className="gap-2 bg-success hover:bg-success/90"
              onClick={() => handleStatusChange("completed", "Завершил")}
              disabled={status !== "working"}
            >
              <CheckCircle2 className="h-5 w-5" />
              Завершил
            </Button>
          </div>

          {/* Comment Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Комментарий</label>
            <Textarea 
              placeholder="Добавьте комментарий о выполненной работе..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            
            <Button variant="outline" className="w-full gap-2">
              <Camera className="h-4 w-4" />
              Добавить фото отчёт
            </Button>
          </div>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="p-6 shadow-card">
          <h3 className="font-semibold mb-4">Предстоящие задачи (2)</h3>
          <div className="space-y-3">
            {[
              { time: "16:30", address: "ул. Пушкина, д. 10", type: "Диагностика" },
              { time: "18:00", address: "пр. Мира, д. 234", type: "Ремонт" },
            ].map((task, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.type}</p>
                  <p className="text-xs text-muted-foreground">{task.address}</p>
                </div>
                <Badge variant="outline">{task.time}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Employee;

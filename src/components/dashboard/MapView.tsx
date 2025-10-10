import { MapPin, Navigation, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const MapView = () => {
  // Mock data for demonstration
  const markers = [
    { id: 1, lat: 55.7558, lng: 37.6173, type: "employee", name: "Алексей М.", status: "working" },
    { id: 2, lat: 55.7608, lng: 37.6294, type: "employee", name: "Дмитрий К.", status: "transit" },
    { id: 3, lat: 55.7489, lng: 37.6212, type: "task", address: "ул. Ленина, 45", time: "14:00" },
    { id: 4, lat: 55.7528, lng: 37.6342, type: "task", address: "пр. Мира, 234", time: "16:30" },
  ];

  return (
    <div className="relative h-full w-full bg-muted">
      {/* Placeholder for map - will be replaced with Yandex Maps */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="text-center space-y-4 p-8">
          <MapPin className="h-16 w-16 text-primary mx-auto" />
          <div>
            <h3 className="text-xl font-semibold mb-2">Интеграция с Яндекс.Картами</h3>
            <p className="text-muted-foreground max-w-md">
              Здесь будет отображаться интерактивная карта с сотрудниками и задачами
            </p>
          </div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Card className="p-3 shadow-lg">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success" />
              <span>На работе</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <span>В пути</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span>Задачи</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Mock markers overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {markers.map((marker) => {
          const x = ((marker.lng - 37.6) / 0.05) * 100;
          const y = ((55.76 - marker.lat) / 0.015) * 100;
          
          return (
            <div
              key={marker.id}
              className="absolute pointer-events-auto"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -100%)",
              }}
            >
              {marker.type === "employee" ? (
                <div className="relative group">
                  <div
                    className={`h-8 w-8 rounded-full border-4 border-white shadow-lg ${
                      marker.status === "working" ? "bg-success" : "bg-warning"
                    } animate-pulse cursor-pointer`}
                  />
                  <Card className="absolute bottom-full mb-2 p-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
                    <p className="font-medium">{marker.name}</p>
                    <p className="text-muted-foreground">
                      {marker.status === "working" ? "Работает" : "В пути"}
                    </p>
                  </Card>
                </div>
              ) : (
                <div className="relative group">
                  <MapPin className="h-8 w-8 text-primary drop-shadow-lg cursor-pointer" fill="currentColor" />
                  <Card className="absolute bottom-full mb-2 p-2 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
                    <p className="font-medium">{marker.address}</p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{marker.time}</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-3">
        <Card className="p-4 shadow-lg flex-1">
          <div className="text-2xl font-bold text-primary">8</div>
          <div className="text-sm text-muted-foreground">Сотрудников на линии</div>
        </Card>
        <Card className="p-4 shadow-lg flex-1">
          <div className="text-2xl font-bold text-warning">12</div>
          <div className="text-sm text-muted-foreground">Активных задач</div>
        </Card>
        <Card className="p-4 shadow-lg flex-1">
          <div className="text-2xl font-bold text-success">24</div>
          <div className="text-sm text-muted-foreground">Завершено сегодня</div>
        </Card>
      </div>
    </div>
  );
};

export default MapView;

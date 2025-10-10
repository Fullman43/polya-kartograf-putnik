import { useEffect, useRef } from "react";
import { MapPin, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

declare global {
  interface Window {
    ymaps: any;
  }
}

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  // Mock data for demonstration
  const markers = [
    { id: 1, lat: 55.7558, lng: 37.6173, type: "employee", name: "Алексей М.", status: "working" },
    { id: 2, lat: 55.7608, lng: 37.6294, type: "employee", name: "Дмитрий К.", status: "transit" },
    { id: 3, lat: 55.7489, lng: 37.6212, type: "task", address: "ул. Ленина, 45", time: "14:00" },
    { id: 4, lat: 55.7528, lng: 37.6342, type: "task", address: "пр. Мира, 234", time: "16:30" },
  ];

  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = () => {
      if (window.ymaps && !mapInstance.current) {
        window.ymaps.ready(() => {
          // Create map centered on Moscow
          const map = new window.ymaps.Map(mapRef.current, {
            center: [55.7558, 37.6173],
            zoom: 13,
            controls: ["zoomControl", "fullscreenControl", "geolocationControl"],
          });

          mapInstance.current = map;

          // Add markers for employees and tasks
          markers.forEach((marker) => {
            let placemark;
            
            if (marker.type === "employee") {
              const iconColor = marker.status === "working" ? "#22c55e" : "#f59e0b";
              placemark = new window.ymaps.Placemark(
                [marker.lat, marker.lng],
                {
                  balloonContent: `
                    <div style="padding: 8px;">
                      <strong>${marker.name}</strong><br/>
                      <span>${marker.status === "working" ? "Работает" : "В пути"}</span>
                    </div>
                  `,
                },
                {
                  preset: "islands#circleIcon",
                  iconColor: iconColor,
                }
              );
            } else {
              placemark = new window.ymaps.Placemark(
                [marker.lat, marker.lng],
                {
                  balloonContent: `
                    <div style="padding: 8px;">
                      <strong>${marker.address}</strong><br/>
                      <span>Время: ${marker.time}</span>
                    </div>
                  `,
                },
                {
                  preset: "islands#blueDotIcon",
                }
              );
            }

            map.geoObjects.add(placemark);
          });
        });
      }
    };

    // Check if ymaps is already loaded
    if (window.ymaps) {
      initMap();
    } else {
      // Wait for script to load
      const checkYmaps = setInterval(() => {
        if (window.ymaps) {
          clearInterval(checkYmaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkYmaps);
    }
  }, []);

  return (
    <div className="relative h-full w-full bg-muted">
      {/* Yandex Map Container */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2 z-10">
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
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

      {/* Bottom stats */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-3 z-10">
        <Card className="p-4 shadow-lg flex-1 bg-background/95 backdrop-blur">
          <div className="text-2xl font-bold text-primary">8</div>
          <div className="text-sm text-muted-foreground">Сотрудников на линии</div>
        </Card>
        <Card className="p-4 shadow-lg flex-1 bg-background/95 backdrop-blur">
          <div className="text-2xl font-bold text-warning">12</div>
          <div className="text-sm text-muted-foreground">Активных задач</div>
        </Card>
        <Card className="p-4 shadow-lg flex-1 bg-background/95 backdrop-blur">
          <div className="text-2xl font-bold text-success">24</div>
          <div className="text-sm text-muted-foreground">Завершено сегодня</div>
        </Card>
      </div>
    </div>
  );
};

export default MapView;

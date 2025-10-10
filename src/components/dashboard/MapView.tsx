import { useEffect, useRef, useState } from "react";
import { MapPin, Clock, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateRoute, formatDuration, formatDistance, calculateETA } from "@/lib/routing";

declare global {
  interface Window {
    ymaps: any;
  }
}

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routeLinesRef = useRef<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; eta: string } | null>(null);

  // Mock data for demonstration
  const markers = [
    { id: 1, lat: 55.7558, lng: 37.6173, type: "employee", name: "Алексей М.", status: "working" },
    { id: 2, lat: 55.7608, lng: 37.6294, type: "employee", name: "Дмитрий К.", status: "transit" },
    { id: 3, lat: 55.7489, lng: 37.6212, type: "task", address: "ул. Ленина, 45", time: "14:00" },
    { id: 4, lat: 55.7528, lng: 37.6342, type: "task", address: "пр. Мира, 234", time: "16:30" },
  ];

  const buildRoute = async (employeeId: number, taskId: number) => {
    const employee = markers.find(m => m.id === employeeId && m.type === "employee");
    const task = markers.find(m => m.id === taskId && m.type === "task");
    
    if (!employee || !task || !mapInstance.current) return;

    // Clear previous routes
    routeLinesRef.current.forEach(line => mapInstance.current.geoObjects.remove(line));
    routeLinesRef.current = [];

    const route = await calculateRoute(
      { lat: employee.lat, lng: employee.lng },
      { lat: task.lat, lng: task.lng }
    );

    if (route && window.ymaps) {
      // Convert coordinates format from [lng, lat] to [lat, lng]
      const coordinates = route.geometry.map(coord => [coord[1], coord[0]]);
      
      const polyline = new window.ymaps.Polyline(
        coordinates,
        {},
        {
          strokeColor: "#3b82f6",
          strokeWidth: 4,
          strokeOpacity: 0.8,
        }
      );

      mapInstance.current.geoObjects.add(polyline);
      routeLinesRef.current.push(polyline);

      // Update route info
      setRouteInfo({
        distance: formatDistance(route.distance),
        duration: formatDuration(route.duration),
        eta: calculateETA(route.duration),
      });

      // Fit map to show the route
      mapInstance.current.setBounds(polyline.geometry.getBounds(), {
        checkZoomRange: true,
        zoomMargin: 50,
      });
    }
  };

  const clearRoute = () => {
    routeLinesRef.current.forEach(line => mapInstance.current?.geoObjects.remove(line));
    routeLinesRef.current = [];
    setSelectedEmployee(null);
    setSelectedTask(null);
    setRouteInfo(null);
  };

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
      <div className="absolute top-4 right-4 space-y-2 z-10 max-w-xs">
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

        {/* Route Planning */}
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Navigation className="h-4 w-4 text-primary" />
              <span>Построить маршрут</span>
            </div>
            <div className="space-y-2">
              <select
                className="w-full text-sm p-2 rounded border bg-background"
                value={selectedEmployee || ""}
                onChange={(e) => setSelectedEmployee(Number(e.target.value))}
              >
                <option value="">Выберите сотрудника</option>
                {markers.filter(m => m.type === "employee").map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <select
                className="w-full text-sm p-2 rounded border bg-background"
                value={selectedTask || ""}
                onChange={(e) => setSelectedTask(Number(e.target.value))}
              >
                <option value="">Выберите задачу</option>
                {markers.filter(m => m.type === "task").map(m => (
                  <option key={m.id} value={m.id}>{m.address}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (selectedEmployee && selectedTask) {
                      buildRoute(selectedEmployee, selectedTask);
                    }
                  }}
                  disabled={!selectedEmployee || !selectedTask}
                >
                  Построить
                </Button>
                {routeInfo && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearRoute}
                  >
                    Очистить
                  </Button>
                )}
              </div>
            </div>

            {/* Route Info */}
            {routeInfo && (
              <div className="pt-2 border-t space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Расстояние:</span>
                  <span className="font-medium">{routeInfo.distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Время в пути:</span>
                  <span className="font-medium">{routeInfo.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Прибытие:</span>
                  <span className="font-medium text-primary">{routeInfo.eta}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10 max-w-md">
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
          <div className="text-xl font-bold text-primary">8</div>
          <div className="text-xs text-muted-foreground">Сотрудников</div>
        </Card>
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
          <div className="text-xl font-bold text-warning">12</div>
          <div className="text-xs text-muted-foreground">Активных</div>
        </Card>
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
          <div className="text-xl font-bold text-success">24</div>
          <div className="text-xs text-muted-foreground">Завершено</div>
        </Card>
      </div>
    </div>
  );
};

export default MapView;

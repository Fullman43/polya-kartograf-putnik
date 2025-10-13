import { useEffect, useRef, useState } from "react";
import { MapPin, Clock, Navigation, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { calculateRoute, formatDuration, formatDistance, calculateETA, parsePointToCoordinates } from "@/lib/routing";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import { useToast } from "@/hooks/use-toast";
import { isToday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

declare global {
  interface Window {
    ymaps: any;
  }
}

const MapView = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routeLinesRef = useRef<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; eta: string } | null>(null);
  const [isGeocodingTasks, setIsGeocodingTasks] = useState(false);
  
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Translation function for work types
  const translateWorkType = (workType: string): string => {
    const translations: Record<string, string> = {
      'repair': 'Ремонт',
      'diagnostics': 'Диагностика',
      'installation': 'Установка',
      'maintenance': 'Обслуживание',
      'consultation': 'Консультация',
      'inspection': 'Осмотр'
    };
    return translations[workType.toLowerCase()] || workType;
  };

  // Filter active tasks (not completed or cancelled)
  const activeTasks = tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled') || [];
  
  // Filter employees with coordinates
  const employeesWithLocation = employees?.filter(e => e.current_location) || [];
  
  // Filter tasks with coordinates
  const tasksWithLocation = activeTasks.filter(t => t.location);

  const buildRoute = async (employeeId: string, taskId: string) => {
    const employee = employees?.find(e => e.id === employeeId);
    const task = tasks?.find(t => t.id === taskId);
    
    if (!employee || !task || !mapInstance.current) return;

    const employeeCoords = parsePointToCoordinates(employee.current_location as any);
    const taskCoords = parsePointToCoordinates(task.location as any);

    if (!employeeCoords) {
      toast({
        title: "Ошибка",
        description: "У сотрудника нет данных о местоположении",
        variant: "destructive",
      });
      return;
    }

    if (!taskCoords) {
      toast({
        title: "Ошибка",
        description: "Задача не имеет координат. Необходимо геокодировать адрес.",
        variant: "destructive",
      });
      return;
    }

    // Clear previous routes
    routeLinesRef.current.forEach(line => mapInstance.current.geoObjects.remove(line));
    routeLinesRef.current = [];

    const route = await calculateRoute(employeeCoords, taskCoords);

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

  const handleGeocodeExistingTasks = async () => {
    setIsGeocodingTasks(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('geocode-existing-tasks');
      
      if (error) throw error;
      
      toast({
        title: "Геокодирование завершено",
        description: `Успешно: ${data.results.success}, Ошибки: ${data.results.failed}`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить геокодирование",
        variant: "destructive",
      });
    } finally {
      setIsGeocodingTasks(false);
    }
  };

  useEffect(() => {
    if (!mapRef.current || loadingEmployees || loadingTasks) return;

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

          // Add employee markers
          employeesWithLocation.forEach((employee) => {
            const coords = parsePointToCoordinates(employee.current_location as any);
            if (!coords) return;

            const iconColor = 
              employee.status === "available" ? "#22c55e" : 
              employee.status === "busy" ? "#f59e0b" : 
              "#94a3b8";

            const placemark = new window.ymaps.Placemark(
              [coords.lat, coords.lng],
              {
                balloonContent: `
                  <div style="padding: 8px;">
                    <strong>${employee.full_name}</strong><br/>
                    <span>${
                      employee.status === "available" ? "Доступен" :
                      employee.status === "busy" ? "Занят" :
                      "Оффлайн"
                    }</span>
                  </div>
                `,
              },
              {
                preset: "islands#circleIcon",
                iconColor: iconColor,
              }
            );

            map.geoObjects.add(placemark);
          });

          // Add task markers
          tasksWithLocation.forEach((task) => {
            const coords = parsePointToCoordinates(task.location as any);
            if (!coords) return;

            const placemark = new window.ymaps.Placemark(
              [coords.lat, coords.lng],
              {
                balloonContent: `
                  <div style="padding: 8px;">
                    <strong>${task.address}</strong><br/>
                    <span>Тип: ${translateWorkType(task.work_type)}</span><br/>
                    <span>Время: ${new Date(task.scheduled_time).toLocaleString("ru-RU")}</span>
                  </div>
                `,
              },
              {
                preset: "islands#blueDotIcon",
              }
            );

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
  }, [employees, tasks, loadingEmployees, loadingTasks]);

  // Setup realtime subscriptions for employees and tasks
  useEffect(() => {
    const channel = supabase
      .channel('map-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'employees' 
      }, () => {
        console.log('Employee data changed');
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tasks' 
      }, () => {
        console.log('Task data changed');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
              <span>Доступен</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <span>Занят</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#94a3b8" }} />
              <span>Оффлайн</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary" />
              <span>Задачи</span>
            </div>
          </div>
        </Card>

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
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Выберите сотрудника</option>
                {employeesWithLocation.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} ({e.status === "available" ? "Доступен" : e.status === "busy" ? "Занят" : "Оффлайн"})
                  </option>
                ))}
              </select>
              <select
                className="w-full text-sm p-2 rounded border bg-background"
                value={selectedTask || ""}
                onChange={(e) => setSelectedTask(e.target.value)}
              >
                <option value="">Выберите задачу</option>
                {tasksWithLocation.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.address} - {translateWorkType(t.work_type)}
                  </option>
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

        {/* Geocoding button for operators */}
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGeocodeExistingTasks}
            disabled={isGeocodingTasks}
          >
            <RefreshCw className={`h-4 w-4 ${isGeocodingTasks ? 'animate-spin' : ''}`} />
            {isGeocodingTasks ? "Геокодирование..." : "Обновить координаты"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Добавить координаты для задач без них
          </p>
        </Card>
      </div>

      {/* Bottom stats */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10 max-w-md">
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
          <div className="text-xl font-bold text-primary">{employees?.length || 0}</div>
          <div className="text-xs text-muted-foreground">Сотрудников</div>
        </Card>
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
          <div className="text-xl font-bold text-warning">
            {employees?.filter(e => e.status === 'available' || e.status === 'busy').length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Активных</div>
        </Card>
        <Card className="p-3 shadow-lg bg-background/95 backdrop-blur">
          <div className="text-xl font-bold text-success">
            {tasks?.filter(t => t.status === 'completed' && t.completed_at && isToday(new Date(t.completed_at))).length || 0}
          </div>
          <div className="text-xs text-muted-foreground">Завершено сегодня</div>
        </Card>
      </div>
    </div>
  );
};

export default MapView;

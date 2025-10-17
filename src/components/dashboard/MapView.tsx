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
import { translateWorkType } from "@/lib/utils";

declare global {
  interface Window {
    ymaps: any;
  }
}

interface MapViewProps {
  onMapReady?: (focusOnEmployee: (employeeId: string) => void, focusOnTask: (taskId: string) => void) => void;
}

const MapView = ({ onMapReady }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const routeLinesRef = useRef<any[]>([]);
  const employeePlacemarksRef = useRef<Map<string, any>>(new Map());
  const taskPlacemarksRef = useRef<Map<string, any>>(new Map());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string; eta: string } | null>(null);
  const [isGeocodingTasks, setIsGeocodingTasks] = useState(false);
  
  const { data: employees, isLoading: loadingEmployees } = useEmployees();
  const { data: tasks, isLoading: loadingTasks } = useTasks();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const focusOnEmployee = (employeeId: string) => {
    const placemark = employeePlacemarksRef.current.get(employeeId);
    if (placemark && mapInstance.current) {
      // Open the balloon
      placemark.balloon.open();
      // Center map on employee
      mapInstance.current.setCenter(placemark.geometry.getCoordinates(), 15, {
        duration: 300,
      });
    }
  };

  const focusOnTask = (taskId: string) => {
    const placemark = taskPlacemarksRef.current.get(taskId);
    if (placemark && mapInstance.current) {
      // Open the balloon
      placemark.balloon.open();
      // Center map on task
      mapInstance.current.setCenter(placemark.geometry.getCoordinates(), 15, {
        duration: 300,
      });
    }
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

          // Clear previous placemarks
          employeePlacemarksRef.current.clear();
          taskPlacemarksRef.current.clear();

          // Add employee markers
          employeesWithLocation.forEach((employee) => {
            const coords = parsePointToCoordinates(employee.current_location as any);
            if (!coords) return;

            const iconColor = 
              employee.status === "available" ? "#22c55e" : 
              employee.status === "busy" ? "#f59e0b" : 
              "#94a3b8";

            // Calculate time since last location update
            const lastUpdate = (employee as any).location_updated_at ? new Date((employee as any).location_updated_at) : null;
            const now = new Date();
            const minutesAgo = lastUpdate ? Math.floor((now.getTime() - lastUpdate.getTime()) / 60000) : null;
            
            let locationTimeText = '';
            if (minutesAgo !== null) {
              if (minutesAgo < 1) {
                locationTimeText = 'только что';
              } else if (minutesAgo < 60) {
                locationTimeText = `${minutesAgo} мин. назад`;
              } else {
                const hoursAgo = Math.floor(minutesAgo / 60);
                locationTimeText = `${hoursAgo} ч. назад`;
              }
            }

            const placemark = new window.ymaps.Placemark(
              [coords.lat, coords.lng],
              {
                balloonContent: `
                  <div style="padding: 10px; min-width: 200px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #333;">${employee.full_name || 'Сотрудник'}</h3>
                    <div style="display: flex; align-items: center; margin-bottom: 6px;">
                      <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; background: ${iconColor};"></span>
                      <span style="font-size: 14px; color: #666;">
                        ${employee.status === "available" ? "Доступен" :
                          employee.status === "busy" ? "Занят" :
                          "Оффлайн"}
                      </span>
                    </div>
                    ${locationTimeText ? `
                      <div style="font-size: 13px; color: #999; margin-top: 4px;">
                        📍 Геометка: ${locationTimeText}
                      </div>
                    ` : ''}
                    ${(employee as any).phone ? `
                      <div style="font-size: 14px; color: #666; margin-top: 6px;">
                        📱 <a href="tel:${(employee as any).phone}" style="color: #3b82f6; text-decoration: none;">${(employee as any).phone}</a>
                      </div>
                    ` : ''}
                  </div>
                `,
              },
              {
                preset: "islands#circleIcon",
                iconColor: iconColor,
              }
            );

            map.geoObjects.add(placemark);
            employeePlacemarksRef.current.set(employee.id, placemark);
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
            taskPlacemarksRef.current.set(task.id, placemark);
          });

          // Notify parent that map is ready
          if (onMapReady) {
            onMapReady(focusOnEmployee, focusOnTask);
          }
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

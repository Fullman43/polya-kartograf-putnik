import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { useTasks } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { cn } from "@/lib/utils";

export function CalendarReport() {
  const { data: tasks } = useTasks();
  const { data: employees } = useEmployees();

  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const workDaysData = useMemo(() => {
    if (!tasks) return new Map<string, { totalMinutes: number; tasksCount: number }>();

    const filteredTasks = tasks.filter(task => {
      if (task.status !== "completed" || !task.completed_at) return false;
      if (selectedEmployee !== "all" && task.assigned_employee_id !== selectedEmployee) return false;
      return true;
    });

    const dayMap = new Map<string, { totalMinutes: number; tasksCount: number }>();

    filteredTasks.forEach(task => {
      const dateKey = format(new Date(task.completed_at!), "yyyy-MM-dd");
      
      let travelTime = 0;
      let workTime = 0;

      if (task.en_route_at && task.started_at) {
        travelTime = Math.round((new Date(task.started_at).getTime() - new Date(task.en_route_at).getTime()) / (1000 * 60));
      }
      
      if (task.started_at && task.completed_at) {
        workTime = Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / (1000 * 60));
      }

      if (!task.en_route_at || !task.started_at) {
        const totalMinutes = Math.round((new Date(task.completed_at!).getTime() - new Date(task.scheduled_time).getTime()) / (1000 * 60));
        travelTime = Math.round(totalMinutes * 0.3);
        workTime = totalMinutes - travelTime;
      }

      const totalTime = travelTime + workTime;

      if (dayMap.has(dateKey)) {
        const existing = dayMap.get(dateKey)!;
        dayMap.set(dateKey, {
          totalMinutes: existing.totalMinutes + totalTime,
          tasksCount: existing.tasksCount + 1,
        });
      } else {
        dayMap.set(dateKey, { totalMinutes: totalTime, tasksCount: 1 });
      }
    });

    return dayMap;
  }, [tasks, selectedEmployee]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}м`;
    if (mins === 0) return `${hours}ч`;
    return `${hours}ч ${mins}м`;
  };

  const getIntensityClass = (minutes: number) => {
    if (minutes === 0) return "";
    if (minutes < 120) return "bg-success/20";
    if (minutes < 240) return "bg-success/40";
    if (minutes < 360) return "bg-success/60";
    if (minutes < 480) return "bg-success/80";
    return "bg-success";
  };

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  // Calculate padding days for the start of the month
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Календарь рабочего времени</h2>
        <p className="text-muted-foreground">Отработанное время по дням</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium">Специалист</label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите специалиста" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все специалисты</SelectItem>
                {employees?.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{format(currentMonth, "LLLL yyyy", { locale: ru })}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
                Сегодня
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Интенсивность цвета показывает объем отработанного времени
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}
            
            {Array.from({ length: paddingDays }).map((_, i) => (
              <div key={`padding-${i}`} className="aspect-square" />
            ))}
            
            {monthDays.map(day => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayData = workDaysData.get(dateKey);
              const minutes = dayData?.totalMinutes || 0;
              const tasksCount = dayData?.tasksCount || 0;

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "aspect-square border rounded-lg p-2 flex flex-col justify-between transition-colors",
                    getIntensityClass(minutes),
                    !isSameMonth(day, currentMonth) && "opacity-50"
                  )}
                >
                  <div className="text-sm font-medium">{format(day, "d")}</div>
                  {minutes > 0 && (
                    <div className="text-xs space-y-1">
                      <div className="font-semibold">{formatHours(minutes)}</div>
                      <div className="text-muted-foreground">{tasksCount} {tasksCount === 1 ? "заявка" : "заявок"}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Интенсивность:</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-success/20 rounded border" />
              <span className="text-xs">2ч</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-success/40 rounded border" />
              <span className="text-xs">4ч</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-success/60 rounded border" />
              <span className="text-xs">6ч</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-success/80 rounded border" />
              <span className="text-xs">8ч</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-success rounded border" />
              <span className="text-xs">8ч+</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

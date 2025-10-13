import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, Download, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

type SortField = "date" | "totalTime" | "travelTime" | "workTime" | "tasksCount";
type SortOrder = "asc" | "desc";

interface TaskDetails {
  id: string;
  orderNumber: string;
  address: string;
  scheduledTime: Date;
  completedTime: Date;
  travelTime: number;
  workTime: number;
}

interface DayReport {
  date: string;
  totalTime: number;
  travelTime: number;
  workTime: number;
  tasksCount: number;
  avgTimePerTask: number;
  tasks: TaskDetails[];
}

export function ActualWorkTimeReport() {
  const { data: tasks } = useTasks();
  const { data: employees } = useEmployees();

  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const reportData = useMemo<DayReport[]>(() => {
    if (!tasks) return [];

    const filteredTasks = tasks.filter(task => {
      if (task.status !== "completed" || !task.completed_at) return false;
      
      if (selectedEmployee !== "all" && task.assigned_employee_id !== selectedEmployee) return false;

      const taskDate = new Date(task.completed_at);
      if (dateFrom && taskDate < dateFrom) return false;
      if (dateTo && taskDate > dateTo) return false;

      return true;
    });

    const groupedByDate = filteredTasks.reduce((acc, task) => {
      const dateKey = format(new Date(task.completed_at!), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, typeof tasks>);

    return Object.entries(groupedByDate).map(([dateKey, dayTasks]) => {
      const taskDetails: TaskDetails[] = dayTasks.map(task => {
        const scheduled = new Date(task.scheduled_time);
        const completed = new Date(task.completed_at!);
        
        // Calculate actual times from timestamps if available
        let travelTime = 0;
        let workTime = 0;
        
        if (task.en_route_at && task.started_at) {
          // Real travel time: from en_route to started
          travelTime = Math.round((new Date(task.started_at).getTime() - new Date(task.en_route_at).getTime()) / (1000 * 60));
        }
        
        if (task.started_at && task.completed_at) {
          // Real work time: from started to completed
          workTime = Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / (1000 * 60));
        }
        
        // Fallback to approximate calculation if real data is missing
        if (!task.en_route_at || !task.started_at) {
          const totalMinutes = Math.round((completed.getTime() - scheduled.getTime()) / (1000 * 60));
          travelTime = Math.round(totalMinutes * 0.3);
          workTime = totalMinutes - travelTime;
        }

        return {
          id: task.id,
          orderNumber: task.order_number || "Н/Д",
          address: task.address,
          scheduledTime: scheduled,
          completedTime: completed,
          travelTime,
          workTime,
        };
      });

      const totalTravelTime = taskDetails.reduce((sum, t) => sum + t.travelTime, 0);
      const totalWorkTime = taskDetails.reduce((sum, t) => sum + t.workTime, 0);
      const totalTime = totalTravelTime + totalWorkTime;

      return {
        date: dateKey,
        totalTime,
        travelTime: totalTravelTime,
        workTime: totalWorkTime,
        tasksCount: dayTasks.length,
        avgTimePerTask: Math.round(totalTime / dayTasks.length),
        tasks: taskDetails,
      };
    });
  }, [tasks, selectedEmployee, dateFrom, dateTo]);

  const sortedData = useMemo(() => {
    return [...reportData].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "date":
          aVal = a.date;
          bVal = b.date;
          break;
        case "totalTime":
          aVal = a.totalTime;
          bVal = b.totalTime;
          break;
        case "travelTime":
          aVal = a.travelTime;
          bVal = b.travelTime;
          break;
        case "workTime":
          aVal = a.workTime;
          bVal = b.workTime;
          break;
        case "tasksCount":
          aVal = a.tasksCount;
          bVal = b.tasksCount;
          break;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [reportData, sortField, sortOrder]);

  const chartData = useMemo(() => {
    return sortedData.slice(0, 10).map(day => ({
      date: format(new Date(day.date), "dd.MM", { locale: ru }),
      "Время в пути": Math.round(day.travelTime / 60),
      "Время работы": Math.round(day.workTime / 60),
    }));
  }, [sortedData]);

  const toggleRowExpansion = (date: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const handleExport = () => {
    // Placeholder for export functionality
    console.log("Export report data:", sortedData);
    alert("Функция экспорта будет реализована");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Отчёт по фактически отработанному времени</h2>
        <p className="text-muted-foreground">Детальная статистика рабочего времени специалистов</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Дата с</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={ru}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Дата по</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={ru}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Сравнение времени в пути и работы</CardTitle>
          <CardDescription>В часах за последние 10 дней</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: "Часы", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Время в пути" fill="hsl(var(--warning))" />
              <Bar dataKey="Время работы" fill="hsl(var(--success))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Детализация по дням</CardTitle>
              <CardDescription>Всего записей: {sortedData.length}</CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Экспорт
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("date")} className="font-semibold">
                      Дата <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("totalTime")} className="font-semibold">
                      Общее время <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("travelTime")} className="font-semibold">
                      Время в пути <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("workTime")} className="font-semibold">
                      Время работы <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("tasksCount")} className="font-semibold">
                      Заявок <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Среднее время</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Нет данных для отображения
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map(day => (
                    <>
                      <TableRow key={day.date} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(day.date)}
                          >
                            {expandedRows.has(day.date) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(day.date), "dd MMMM yyyy", { locale: ru })}
                        </TableCell>
                        <TableCell>{formatMinutes(day.totalTime)}</TableCell>
                        <TableCell className="text-warning">{formatMinutes(day.travelTime)}</TableCell>
                        <TableCell className="text-success">{formatMinutes(day.workTime)}</TableCell>
                        <TableCell>{day.tasksCount}</TableCell>
                        <TableCell>{formatMinutes(day.avgTimePerTask)}</TableCell>
                      </TableRow>
                      {expandedRows.has(day.date) && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                              <div className="space-y-2">
                              <h4 className="font-semibold mb-3">Детализация заявок:</h4>
                              {day.tasks.map(task => {
                                const taskData = tasks?.find(t => t.id === task.id);
                                const hasRealData = taskData?.en_route_at && taskData?.started_at;
                                
                                return (
                                  <div key={task.id} className="p-3 bg-background rounded-lg border">
                                    {!hasRealData && (
                                      <div className="mb-2 text-xs text-warning flex items-center gap-1">
                                        <span>⚠️</span>
                                        <span>Примерный расчёт (нет данных о времени в пути)</span>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-5 gap-4 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Заявка:</span>
                                        <p className="font-medium">{task.orderNumber}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Адрес:</span>
                                        <p className="font-medium">{task.address}</p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Начало:</span>
                                        <p className="font-medium">
                                          {format(task.scheduledTime, "HH:mm", { locale: ru })}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Завершение:</span>
                                        <p className="font-medium">
                                          {format(task.completedTime, "HH:mm", { locale: ru })}
                                        </p>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Время работы:</span>
                                        <p className="font-medium">{formatMinutes(task.workTime)}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

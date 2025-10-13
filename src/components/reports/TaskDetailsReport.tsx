import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon, ArrowUpDown } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";

type SortField = "orderNumber" | "date" | "travelTime" | "workTime";
type SortOrder = "asc" | "desc";

export function TaskDetailsReport() {
  const { data: tasks } = useTasks();
  const { data: employees } = useEmployees();

  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const taskDetails = useMemo(() => {
    if (!tasks) return [];

    const filteredTasks = tasks.filter(task => {
      if (task.status !== "completed" || !task.completed_at) return false;
      
      if (selectedEmployee !== "all" && task.assigned_employee_id !== selectedEmployee) return false;

      const taskDate = new Date(task.completed_at);
      if (dateFrom && taskDate < dateFrom) return false;
      if (dateTo && taskDate > dateTo) return false;

      return true;
    });

    return filteredTasks.map(task => {
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

      const employee = employees?.find(e => e.id === task.assigned_employee_id);

      return {
        id: task.id,
        orderNumber: task.order_number || "Н/Д",
        address: task.address,
        employeeName: employee?.full_name || "Неизвестно",
        date: new Date(task.completed_at!),
        travelTime,
        workTime,
        totalTime: travelTime + workTime,
        hasRealData: Boolean(task.en_route_at && task.started_at),
      };
    });
  }, [tasks, employees, selectedEmployee, dateFrom, dateTo]);

  const sortedTasks = useMemo(() => {
    return [...taskDetails].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "orderNumber":
          aVal = a.orderNumber;
          bVal = b.orderNumber;
          break;
        case "date":
          aVal = a.date.getTime();
          bVal = b.date.getTime();
          break;
        case "travelTime":
          aVal = a.travelTime;
          bVal = b.travelTime;
          break;
        case "workTime":
          aVal = a.workTime;
          bVal = b.workTime;
          break;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [taskDetails, sortField, sortOrder]);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Детальный отчёт по заявкам</h2>
        <p className="text-muted-foreground">Время работы по каждой заявке</p>
      </div>

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
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Заявки</CardTitle>
          <CardDescription>Всего заявок: {sortedTasks.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("orderNumber")} className="font-semibold">
                      Номер заявки <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("date")} className="font-semibold">
                      Дата <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Специалист</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("travelTime")} className="font-semibold">
                      В пути <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("workTime")} className="font-semibold">
                      Выполнение <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Всего</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Нет данных для отображения
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.orderNumber}</TableCell>
                      <TableCell>{format(task.date, "dd.MM.yyyy HH:mm", { locale: ru })}</TableCell>
                      <TableCell>{task.address}</TableCell>
                      <TableCell>{task.employeeName}</TableCell>
                      <TableCell className="text-warning">
                        {formatMinutes(task.travelTime)}
                        {!task.hasRealData && <span className="text-xs ml-1">*</span>}
                      </TableCell>
                      <TableCell className="text-success">{formatMinutes(task.workTime)}</TableCell>
                      <TableCell className="font-semibold">{formatMinutes(task.totalTime)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {sortedTasks.some(t => !t.hasRealData) && (
            <p className="text-xs text-muted-foreground mt-2">* Примерный расчёт (нет данных о времени в пути)</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

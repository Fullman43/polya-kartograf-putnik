import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTask } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { geocodeAddress, formatToPostGISPoint } from "@/lib/routing";
import { useToast } from "@/hooks/use-toast";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const { data: employees } = useEmployees();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    address: "",
    type: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    time: "",
    employee: "",
    customerName: "",
    customerPhone: "",
    priority: "medium",
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsGeocoding(true);
    
    try {
      // Geocode the address
      const coordinates = await geocodeAddress(formData.address);
      
      if (!coordinates) {
        toast({
          title: "Ошибка геокодирования",
          description: "Не удалось найти координаты для указанного адреса",
          variant: "destructive",
        });
        setIsGeocoding(false);
        return;
      }

      const scheduledDateTime = `${formData.date}T${formData.time}:00`;
      
      await createTask.mutateAsync({
        address: formData.address,
        location: formatToPostGISPoint(coordinates.lat, coordinates.lng) as any,
        work_type: formData.type,
        description: formData.description || null,
        scheduled_time: scheduledDateTime,
        assigned_employee_id: formData.employee || null,
        customer_name: formData.customerName || null,
        customer_phone: formData.customerPhone || null,
        priority: formData.priority as "low" | "medium" | "high" | "urgent",
        status: "pending",
      });
      
      onOpenChange(false);
      setFormData({
        address: "",
        type: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        time: "",
        employee: "",
        customerName: "",
        customerPhone: "",
        priority: "medium",
      });
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать задачу</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Имя заказчика</Label>
              <Input
                id="customerName"
                placeholder="ООО Компания / Иванов И.И."
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Телефон заказчика</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="+7 (999) 123-45-67"
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData({ ...formData, customerPhone: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес</Label>
            <Input
              id="address"
              placeholder="ул. Ленина, д. 45"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Тип работы</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип работы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="installation">Установка</SelectItem>
                <SelectItem value="repair">Ремонт</SelectItem>
                <SelectItem value="diagnostics">Диагностика</SelectItem>
                <SelectItem value="configuration">Настройка</SelectItem>
                <SelectItem value="maintenance">Обслуживание</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Подробное описание работы..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Дата</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">Время</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Приоритет</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="urgent">Срочно</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Назначить сотрудника</Label>
              <Select
                value={formData.employee}
                onValueChange={(value) =>
                  setFormData({ ...formData, employee: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не назначен" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={createTask.isPending || isGeocoding}>
              {createTask.isPending || isGeocoding ? "Создание..." : "Создать задачу"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

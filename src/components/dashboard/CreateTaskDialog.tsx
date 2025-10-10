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
import { toast } from "sonner";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    address: "",
    type: "",
    description: "",
    time: "",
    employee: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Задача создана успешно!");
    onOpenChange(false);
    setFormData({
      address: "",
      type: "",
      description: "",
      time: "",
      employee: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Создать задачу</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="employee">Назначить сотрудника</Label>
              <Select
                value={formData.employee}
                onValueChange={(value) =>
                  setFormData({ ...formData, employee: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Авто-выбор" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Ближайший свободный</SelectItem>
                  <SelectItem value="emp1">Алексей М.</SelectItem>
                  <SelectItem value="emp2">Дмитрий К.</SelectItem>
                  <SelectItem value="emp3">Сергей В.</SelectItem>
                  <SelectItem value="emp4">Иван П.</SelectItem>
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
            <Button type="submit">Создать задачу</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

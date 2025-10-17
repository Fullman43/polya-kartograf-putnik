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
import { formatToPostGISPoint } from "@/lib/routing";
import { useToast } from "@/hooks/use-toast";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { AddressSuggestion } from "@/hooks/useAddressSuggestions";
import { useUploadTaskPhotosBulk } from "@/hooks/useTaskPhotos";
import { X, ImagePlus } from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
  const createTask = useCreateTask();
  const { data: employees } = useEmployees();
  const { toast } = useToast();
  const uploadPhotosBulk = useUploadTaskPhotosBulk();
  
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
  const [addressDetails, setAddressDetails] = useState<AddressSuggestion | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size (max 5MB per file)
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Файл слишком большой",
          description: `${file.name} превышает 5MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    // Limit to 5 photos total
    if (selectedPhotos.length + validFiles.length > 5) {
      toast({
        title: "Слишком много фото",
        description: "Максимум 5 фотографий",
        variant: "destructive",
      });
      return;
    }

    setSelectedPhotos([...selectedPhotos, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addressDetails) {
      toast({
        title: "Ошибка",
        description: "Выберите адрес из списка подсказок",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const scheduledDateTime = `${formData.date}T${formData.time}:00`;
      
      const newTask = await createTask.mutateAsync({
        address: formData.address,
        location: formatToPostGISPoint(addressDetails.coordinates.lat, addressDetails.coordinates.lng) as any,
        work_type: formData.type,
        description: formData.description || null,
        scheduled_time: scheduledDateTime,
        assigned_employee_id: formData.employee || null,
        customer_name: formData.customerName || null,
        customer_phone: formData.customerPhone || null,
        priority: formData.priority as "low" | "medium" | "high" | "urgent",
        status: formData.employee ? "assigned" : "pending",
      });

      // Upload photos if any
      if (selectedPhotos.length > 0 && newTask?.id) {
        await uploadPhotosBulk.mutateAsync({
          taskId: newTask.id,
          files: selectedPhotos,
        });
      }
      
      onOpenChange(false);
      
      // Reset form
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
      setAddressDetails(null);
      setSelectedPhotos([]);
      setPhotoPreviews([]);
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
            <AddressAutocomplete
              value={formData.address}
              onChange={(value, details) => {
                setFormData({ ...formData, address: value });
                if (details) {
                  setAddressDetails(details);
                }
              }}
              placeholder="Начните вводить адрес..."
            />
            {addressDetails && (
              <p className="text-xs text-muted-foreground">
                {addressDetails.city && `${addressDetails.city}, `}
                {addressDetails.street && `${addressDetails.street}, `}
                {addressDetails.house && `д. ${addressDetails.house}`}
              </p>
            )}
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
                <SelectItem value="mounting">Монтаж</SelectItem>
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

          <div className="space-y-2">
            <Label>Прикрепить фото (до 5 шт.)</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={selectedPhotos.length >= 5}
                >
                  <ImagePlus className="h-4 w-4 mr-2" />
                  Добавить фото
                </Button>
                <span className="text-xs text-muted-foreground">
                  {selectedPhotos.length}/5
                </span>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Создание..." : "Создать задачу"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

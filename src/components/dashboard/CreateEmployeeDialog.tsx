import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateEmployee } from "@/hooks/useEmployees";
import { toast } from "@/hooks/use-toast";

const employeeSchema = z.object({
  email: z.string().email({ message: "Некорректный email" }).trim(),
  full_name: z
    .string()
    .min(2, { message: "Имя должно содержать минимум 2 символа" })
    .max(100, { message: "Имя должно быть меньше 100 символов" })
    .trim(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Некорректный номер телефона" })
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(6, { message: "Пароль должен содержать минимум 6 символов" })
    .max(72, { message: "Пароль должен быть меньше 72 символов" }),
  role: z.enum(["employee", "operator"], {
    required_error: "Выберите роль",
  }),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateEmployeeDialog({
  open,
  onOpenChange,
}: CreateEmployeeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createEmployee = useCreateEmployee();

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      email: "",
      full_name: "",
      phone: "",
      password: "",
      role: "employee",
    },
  });

  const handleSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    try {
      const employeeData = {
        email: data.email,
        full_name: data.full_name,
        phone: data.phone || undefined,
        password: data.password,
        role: data.role,
      };
      await createEmployee.mutateAsync(employeeData);
      toast({
        title: "Сотрудник добавлен",
        description: `${data.full_name} успешно добавлен в систему`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить сотрудника",
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
          <DialogTitle>Добавить сотрудника</DialogTitle>
          <DialogDescription>
            Создайте учетную запись для нового сотрудника
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Полное имя</FormLabel>
                  <FormControl>
                    <Input placeholder="Иванов Иван Иванович" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон (опционально)</FormLabel>
                  <FormControl>
                    <Input placeholder="+79991234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Роль</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите роль" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employee">Сотрудник</SelectItem>
                      <SelectItem value="operator">Оператор</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Создание..." : "Создать"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

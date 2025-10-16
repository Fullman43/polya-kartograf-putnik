import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const OrganizationRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [formData, setFormData] = useState({
    // Organization data
    name: "",
    inn: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    // User data
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Register user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.contact_email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.contact_person,
            phone: formData.contact_phone,
            role: "organization_owner",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Не удалось создать пользователя");

      // Wait a bit for the trigger to create the employee record
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 2. Create organization
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.name,
          inn: formData.inn,
          contact_person: formData.contact_person,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone || null,
        })
        .select()
        .single();

      if (orgError) {
        console.error("Organization creation error:", orgError);
        throw new Error(`Не удалось создать организацию: ${orgError.message}`);
      }

      // 3. Update employee record with organization_id
      const { error: empError } = await supabase
        .from("employees")
        .update({ organization_id: orgData.id })
        .eq("user_id", authData.user.id);

      if (empError) {
        console.error("Employee update error:", empError);
        throw new Error(`Не удалось связать сотрудника с организацией: ${empError.message}`);
      }

      console.log("Registration successful! Organization:", orgData);

      toast({
        title: "Успешная регистрация",
        description: "Организация создана! Пробный период: 14 дней. Выполняется вход...",
      });

      // Reload the page after successful registration to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Название организации</Label>
        <Input
          id="org-name"
          placeholder="ООО Компания"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="inn">ИНН</Label>
        <Input
          id="inn"
          placeholder="1234567890"
          value={formData.inn}
          onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
          required
          maxLength={12}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-person">ФИО ответственного лица</Label>
        <Input
          id="contact-person"
          placeholder="Иванов Иван Иванович"
          value={formData.contact_person}
          onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-email">Email для связи</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="contact@company.com"
          value={formData.contact_email}
          onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-phone">Телефон (необязательно)</Label>
        <Input
          id="contact-phone"
          type="tel"
          placeholder="+7 (999) 123-45-67"
          value={formData.contact_phone}
          onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          type="password"
          placeholder="Минимум 6 символов"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Подтвердите пароль</Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Повторите пароль"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="org-privacy-policy" 
          checked={agreedToPrivacy}
          onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
        />
        <label
          htmlFor="org-privacy-policy"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Я согласен с{" "}
          <a 
            href="/privacy-policy" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            политикой конфиденциальности
          </a>
          {" "}и{" "}
          <a 
            href="/terms-of-service" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            пользовательским соглашением
          </a>
        </label>
      </div>

      <Button type="submit" className="w-full" disabled={loading || !agreedToPrivacy}>
        {loading ? "Создание..." : "Создать организацию"}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        Пробный период: 14 дней
      </p>
    </form>
  );
};

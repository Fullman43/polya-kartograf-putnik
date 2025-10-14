import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrganization } from "@/hooks/useOrganization";

export const OrganizationRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    inn: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
  });

  const createOrganization = useCreateOrganization();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrganization.mutate(formData);
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

      <Button type="submit" className="w-full" disabled={createOrganization.isPending}>
        {createOrganization.isPending ? "Создание..." : "Создать организацию"}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        Пробный период: 14 дней
      </p>
    </form>
  );
};

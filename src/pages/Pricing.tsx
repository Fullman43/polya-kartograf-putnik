import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users } from "lucide-react";
import logo from "@/assets/fieldcontrol-logo.png";

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Стартовый",
      price: 3990,
      employees: 5,
      description: "Идеально для небольших команд",
      features: [
        "До 5 сотрудников",
        "Управление задачами",
        "Отслеживание на карте",
        "Базовые отчёты",
        "Telegram интеграция",
      ],
    },
    {
      name: "Рост",
      price: 7990,
      employees: 15,
      description: "Для растущих компаний",
      features: [
        "До 15 сотрудников",
        "Управление задачами",
        "Отслеживание на карте",
        "Расширенные отчёты",
        "Telegram интеграция",
        "Приоритетная поддержка",
      ],
      popular: true,
    },
    {
      name: "Про",
      price: 12990,
      employees: 30,
      description: "Для больших команд",
      features: [
        "До 30 сотрудников",
        "Управление задачами",
        "Отслеживание на карте",
        "Полные отчёты и аналитика",
        "Telegram интеграция",
        "Приоритетная поддержка",
        "API доступ",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FieldControl.ru" className="h-14 w-14" />
            <span className="text-xl font-semibold">FieldControl.ru</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Button onClick={() => navigate("/")} variant="ghost" className="font-semibold">
              Главная
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" className="bg-white">
              Войти
            </Button>
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="space-y-4 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">Выберите подходящий тариф для вашей команды</h1>
          <p className="text-xl text-muted-foreground">
            Пробный период - 14 дней для всех тарифов
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`bg-white ${plan.popular ? "border-primary shadow-xl scale-105" : "shadow-lg"}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge className="bg-blue-500">Популярный</Badge>
                  )}
                </div>
                <CardDescription className="text-base">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-4xl font-bold">{plan.price.toLocaleString('ru-RU')} ₽</div>
                  <div className="text-sm text-muted-foreground">в месяц</div>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>До {plan.employees} сотрудников</span>
                </div>
                <div className="space-y-3 pt-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => navigate("/auth")}
                >
                  Оплатить
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="max-w-4xl mx-auto mt-12 bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Часто задаваемые вопросы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Что происходит после окончания пробного периода?</h4>
              <p className="text-muted-foreground">
                После окончания 14-дневного пробного периода необходимо выбрать и оплатить подходящий тариф для продолжения работы.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Можно ли изменить тариф?</h4>
              <p className="text-muted-foreground">
                Да, вы можете изменить тариф в любое время. При переходе на более высокий тариф разница будет пересчитана пропорционально.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-lg">Что включено во все тарифы?</h4>
              <p className="text-muted-foreground">
                Все тарифы включают базовый функционал: управление задачами, отслеживание сотрудников на карте, интеграцию с Telegram и отчёты.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src={logo}
                  alt="FieldControl.ru" 
                  className="h-8 w-8"
                />
                <h3 className="text-xl font-bold">FieldControl.ru</h3>
              </div>
              <p className="text-muted-foreground">
                Сервис для управления выездными сотрудниками
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Документы</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="/privacy-policy" className="hover:text-foreground transition-colors hover:underline">
                    Политика конфиденциальности
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="hover:text-foreground transition-colors hover:underline">
                    Пользовательское соглашение
                  </a>
                </li>
                <li>
                  <a href="/consent" className="hover:text-foreground transition-colors hover:underline">
                    Согласие на обработку ПД
                  </a>
                </li>
              </ul>
              <div className="mt-6">
                <p className="text-muted-foreground">
                  Email: <a href="mailto:info@fieldcontrol.ru" className="hover:text-foreground transition-colors hover:underline">info@fieldcontrol.ru</a>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-muted-foreground">
            <p>© 2025 FieldControl.ru. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;

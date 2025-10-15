import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const Subscription = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: organization, isLoading: orgLoading } = useOrganization();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading || orgLoading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

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

  const currentStatus = organization?.subscription_status || "trial";
  const trialEndsAt = organization?.trial_ends_at;
  const isTrialActive = currentStatus === "trial" && trialEndsAt && new Date(trialEndsAt) > new Date();

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Управление подпиской</h1>
          <p className="text-muted-foreground">
            Выберите подходящий тариф для вашей команды
          </p>
        </div>

        {organization && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Текущая подписка
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Статус:</span>
                <Badge variant={isTrialActive ? "secondary" : "default"}>
                  {isTrialActive ? "Пробный период" : currentStatus === "active" ? "Активна" : "Неактивна"}
                </Badge>
              </div>
              {isTrialActive && trialEndsAt && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">Пробный период заканчивается:</span>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(trialEndsAt), { addSuffix: true, locale: ru })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Организация:</span>
                <span className="font-medium">{organization.name}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge variant="default">Популярный</Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{plan.price.toLocaleString('ru-RU')} ₽</div>
                  <div className="text-sm text-muted-foreground">в месяц</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>До {plan.employees} сотрудников</span>
                </div>
                <div className="space-y-2 pt-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  Оплатить
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Часто задаваемые вопросы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Что происходит после окончания пробного периода?</h4>
              <p className="text-sm text-muted-foreground">
                После окончания 14-дневного пробного периода необходимо выбрать и оплатить подходящий тариф для продолжения работы.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Можно ли изменить тариф?</h4>
              <p className="text-sm text-muted-foreground">
                Да, вы можете изменить тариф в любое время. При переходе на более высокий тариф разница будет пересчитана пропорционально.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Что включено во все тарифы?</h4>
              <p className="text-sm text-muted-foreground">
                Все тарифы включают базовый функционал: управление задачами, отслеживание сотрудников на карте, интеграцию с Telegram и отчёты.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Subscription;

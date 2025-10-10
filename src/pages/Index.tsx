import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Users, BarChart3, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Контроль выездных сотрудников</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Управление и мониторинг полевого персонала
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Отслеживайте местоположение сотрудников, управляйте задачами и оптимизируйте 
            логистику в режиме реального времени
          </p>

          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <Users className="h-5 w-5" />
              Панель оператора
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/employee")}
              className="gap-2"
            >
              <MapPin className="h-5 w-5" />
              Интерфейс сотрудника
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="p-6 shadow-card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Карта в реальном времени</h3>
            <p className="text-muted-foreground">
              Видите всех сотрудников и задачи на интерактивной карте с маршрутами и ETA
            </p>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Отслеживание статусов</h3>
            <p className="text-muted-foreground">
              Контроль прогресса работы с GPS-метками и временными штампами
            </p>
          </Card>

          <Card className="p-6 shadow-card hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Аналитика и отчёты</h3>
            <p className="text-muted-foreground">
              Детальная статистика по времени, маршрутам и эффективности команды
            </p>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: "95%", label: "Точность GPS" },
            { value: "< 2с", label: "Обновление данных" },
            { value: "∞", label: "Сотрудников" },
            { value: "24/7", label: "Поддержка" },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;

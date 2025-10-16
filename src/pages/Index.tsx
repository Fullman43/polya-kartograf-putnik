import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { MapPin, CheckSquare, BarChart3, Send } from "lucide-react";
import logo from "@/assets/fieldcontrol-logo.png";
import heroImage from "@/assets/hero-dashboard.png";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FieldControl.ru" className="h-12 w-12" />
            <span className="text-xl font-semibold">FieldControl.ru</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Button onClick={() => navigate("/pricing")} variant="ghost" className="font-semibold">
              Тарифы
            </Button>
            <Button onClick={() => navigate("/auth")} variant="outline" className="bg-white">
              Войти
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Полный контроль и эффективность вашей выездной команды
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Отслеживайте сотрудников в реальном времени, управляйте задачами и повышайте продуктивность с помощью умной системы GPS-мониторинга.
            </p>

            <Button 
              size="lg" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
              onClick={() => navigate("/auth")}
            >
              Попробовать бесплатно
            </Button>
          </div>

          {/* Right Visual - Hero Image */}
          <div className="hidden lg:flex justify-center items-center">
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Dashboard и мобильное приложение с GPS-мониторингом" 
                className="w-full max-w-xl rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
              <MapPin className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Карта онлайн</h3>
            <p className="text-muted-foreground text-sm">
              Визуализируйте сотрудников на маршрутной онлайн карте с ETA и маршрутами
            </p>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
              <CheckSquare className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Контроль задач</h3>
            <p className="text-muted-foreground text-sm">
              Следите за выполнением задач, статусами и геопозицией
            </p>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Отчёты и аналитика</h3>
            <p className="text-muted-foreground text-sm">
              Получайте детальные отчеты о-времени, маршру, XPI и KPI
            </p>
          </Card>

          <Card className="p-6 bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-14 w-14 rounded-xl bg-cyan-100 flex items-center justify-center mb-4">
              <Send className="h-7 w-7 text-cyan-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Интеграция с Telegram</h3>
            <p className="text-muted-foreground text-sm">
              Мгновенные оповещения и отчеты прямо в Telegram
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
              <div className="text-4xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/src/assets/fieldcontrol-logo.png" 
                  alt="FieldControl.ru" 
                  className="h-8 w-8"
                />
                <h3 className="text-xl font-bold text-white">FieldControl.ru</h3>
              </div>
              <p className="text-white/70">
                Сервис для управления выездными сотрудниками
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Документы</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="/privacy-policy" className="hover:text-white transition-colors hover:underline">
                    Политика конфиденциальности
                  </a>
                </li>
                <li>
                  <a href="/terms-of-service" className="hover:text-white transition-colors hover:underline">
                    Пользовательское соглашение
                  </a>
                </li>
                <li>
                  <a href="/consent" className="hover:text-white transition-colors hover:underline">
                    Согласие на обработку ПД
                  </a>
                </li>
              </ul>
              <div className="mt-6">
                <p className="text-white/70">
                  Email: <a href="mailto:info@fieldcontrol.ru" className="hover:text-white transition-colors hover:underline">info@fieldcontrol.ru</a>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/60">
            <p>© 2025 FieldControl.ru. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

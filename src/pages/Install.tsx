import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Download, CheckCircle, Zap, Wifi, Bell, Maximize2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event (Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-scale-in border-primary/20 shadow-lg">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-fade-in shadow-elegant">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Приложение установлено!
              </h2>
              <p className="text-muted-foreground">
                FieldControl успешно установлен на ваше устройство
              </p>
            </div>
            <Button 
              onClick={() => window.location.href = '/employee'} 
              size="lg" 
              className="w-full animate-fade-in shadow-lg hover:shadow-xl transition-shadow"
              style={{ animationDelay: '0.2s' }}
            >
              Открыть приложение
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const benefits = [
    { icon: Zap, title: "Быстрый доступ", desc: "Запуск с домашнего экрана за секунду" },
    { icon: Wifi, title: "Офлайн режим", desc: "Работает без интернета" },
    { icon: Bell, title: "Уведомления", desc: "Мгновенные push о новых задачах" },
    { icon: Maximize2, title: "Полный экран", desc: "Максимум пространства для работы" }
  ];

  const installUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 relative">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-elegant animate-scale-in">
              <Smartphone className="w-12 h-12 text-white" />
            </div>
            <div className="space-y-3" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Установите FieldControl
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Получите доступ к приложению прямо с домашнего экрана вашего устройства
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12 space-y-8">
        {/* QR Code Section */}
        <Card className="animate-fade-in border-primary/20 shadow-lg" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Быстрая установка</h2>
                </div>
                <p className="text-muted-foreground">
                  Отсканируйте QR-код камерой вашего телефона для быстрого доступа к странице установки
                </p>
                {platform === 'android' && deferredPrompt && (
                  <Button onClick={handleInstallClick} size="lg" className="w-full md:w-auto gap-2 shadow-lg">
                    <Download className="w-5 h-5" />
                    Установить сейчас
                  </Button>
                )}
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-lg">
                <QRCodeSVG 
                  value={installUrl} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card 
                key={index}
                className="animate-fade-in hover-scale border-primary/10 hover:border-primary/30 transition-all shadow-md hover:shadow-elegant"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Installation Instructions */}
        <Card className="animate-fade-in border-primary/20 shadow-lg" style={{ animationDelay: '0.7s' }}>
          <CardContent className="p-6 md:p-8 space-y-6">
            {platform === 'ios' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  Установка на iOS
                </h3>
                <ol className="space-y-4">
                  {[
                    "Откройте эту страницу в браузере Safari",
                    "Нажмите кнопку «Поделиться» (квадрат со стрелкой вверх) внизу экрана",
                    "Прокрутите вниз и выберите «На экран «Домой»»",
                    "Нажмите «Добавить» в правом верхнем углу"
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4 items-start group">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-elegant transition-shadow">
                        {i + 1}
                      </span>
                      <span className="flex-1 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {platform === 'android' && !deferredPrompt && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  Установка на Android
                </h3>
                <ol className="space-y-4">
                  {[
                    "Откройте меню браузера (три точки в правом верхнем углу)",
                    "Выберите «Установить приложение» или «Добавить на главный экран»",
                    "Подтвердите установку"
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4 items-start group">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:shadow-elegant transition-shadow">
                        {i + 1}
                      </span>
                      <span className="flex-1 pt-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {platform === 'desktop' && (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Откройте на мобильном устройстве</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Отсканируйте QR-код выше или откройте эту страницу на вашем телефоне для установки приложения
                </p>
              </div>
            )}

            <div className="flex justify-center pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/employee'}
                className="hover-scale"
              >
                Продолжить в браузере
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Install;

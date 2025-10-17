import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Download, CheckCircle } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Приложение установлено!</CardTitle>
            <CardDescription>
              FieldControl успешно установлен на ваше устройство
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.href = '/employee'} size="lg" className="w-full">
              Открыть приложение
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">Установите FieldControl</CardTitle>
            <CardDescription className="text-base">
              Получите доступ к приложению прямо с домашнего экрана
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {platform === 'android' && deferredPrompt && (
              <div className="text-center">
                <Button onClick={handleInstallClick} size="lg" className="w-full gap-2">
                  <Download className="w-5 h-5" />
                  Установить приложение
                </Button>
              </div>
            )}

            {platform === 'ios' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Установка на iOS (iPhone/iPad):</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    <span>Откройте эту страницу в браузере <strong>Safari</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    <span>Нажмите кнопку "Поделиться" (квадрат со стрелкой вверх) внизу экрана</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                    <span>Прокрутите вниз и выберите "На экран «Домой»"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span>
                    <span>Нажмите "Добавить" в правом верхнем углу</span>
                  </li>
                </ol>
              </div>
            )}

            {platform === 'android' && !deferredPrompt && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Установка на Android:</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                    <span>Откройте меню браузера (три точки в правом верхнем углу)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                    <span>Выберите "Установить приложение" или "Добавить на главный экран"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                    <span>Подтвердите установку</span>
                  </li>
                </ol>
              </div>
            )}

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-lg mb-3">Преимущества установки:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Быстрый доступ с домашнего экрана</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Работает без интернета</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Push-уведомления о новых задачах</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Полноэкранный режим</span>
                </li>
              </ul>
            </div>

            <div className="text-center pt-4">
              <Button variant="outline" onClick={() => window.location.href = '/employee'}>
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

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTelegramLink, useGenerateAuthCode, useUnlinkTelegram } from "@/hooks/useTelegramAuth";
import { Loader2, CheckCircle, XCircle, Copy } from "lucide-react";

export const TelegramSettings = () => {
  const { toast } = useToast();
  const [authCode, setAuthCode] = useState<string | null>(null);
  const { data: telegramLink, isLoading } = useTelegramLink();
  const generateCode = useGenerateAuthCode();
  const unlinkTelegram = useUnlinkTelegram();

  const handleGenerateCode = async () => {
    const result = await generateCode.mutateAsync();
    setAuthCode(result.code);
  };

  const handleCopyCode = () => {
    if (authCode) {
      navigator.clipboard.writeText(authCode);
      toast({
        title: "Скопировано",
        description: "Код скопирован в буфер обмена",
      });
    }
  };

  const handleUnlink = async () => {
    if (confirm("Вы уверены, что хотите отвязать Telegram?")) {
      await unlinkTelegram.mutateAsync();
      setAuthCode(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Telegram Бот
          {telegramLink ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-gray-400" />
          )}
        </CardTitle>
        <CardDescription>
          Управляйте задачами через Telegram бот
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {telegramLink ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-medium text-green-900">
                ✅ Telegram привязан
              </p>
              {telegramLink.telegram_username && (
                <p className="text-sm text-green-700 mt-1">
                  @{telegramLink.telegram_username}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Теперь вы можете управлять своими задачами через Telegram бот.
              </p>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <p className="font-medium text-sm">Доступные команды:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• /tasks - Показать мои задачи</li>
                  <li>• /active - Активные задачи</li>
                  <li>• /completed - Завершенные задачи</li>
                  <li>• /status - Изменить статус</li>
                  <li>• /help - Справка</li>
                </ul>
              </div>
            </div>

            <Button 
              variant="destructive" 
              onClick={handleUnlink}
              disabled={unlinkTelegram.isPending}
            >
              {unlinkTelegram.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Отвязать Telegram
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Привяжите свой Telegram аккаунт, чтобы получать уведомления и управлять задачами через бот.
            </p>

            {!authCode ? (
              <Button 
                onClick={handleGenerateCode}
                disabled={generateCode.isPending}
              >
                {generateCode.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Получить код для привязки
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Ваш код для привязки:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-2xl font-mono font-bold text-blue-600 bg-white px-4 py-2 rounded border border-blue-300 flex-1 text-center">
                      {authCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    Код действителен 15 минут
                  </p>
                </div>

                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <p className="font-medium text-sm">Инструкция:</p>
                  <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                    <li>Откройте Telegram бот</li>
                    <li>Отправьте команду: <code className="bg-white px-1 rounded">/auth {authCode}</code></li>
                    <li>Дождитесь подтверждения</li>
                  </ol>
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleGenerateCode}
                  disabled={generateCode.isPending}
                >
                  Создать новый код
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

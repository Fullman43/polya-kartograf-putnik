import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Политика обработки персональных данных</h1>
          
          <div className="space-y-6 text-gray-700">
            <div>
              <p className="font-semibold">ИП Шевцов Кирилл Владимирович</p>
              <p>ИНН 504723071188, ОГРНИП 322508100081213</p>
              <p>Домен: fieldcontrol.ru</p>
              <p>Контакт: info@fieldcontrol.ru</p>
            </div>

            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Общие положения</h2>
              <p>
                Настоящая Политика регулирует порядок обработки и защиты персональных данных пользователей 
                сервиса FieldControl Контроль персонала. Оператор обеспечивает защиту персональных данных 
                в соответствии с 152-ФЗ.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Цели обработки персональных данных</h2>
              <p>
                Предоставление доступа к сервису, учет заявок, идентификация пользователей, обмен 
                уведомлениями, выполнение договорных обязательств.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Состав обрабатываемых данных</h2>
              <p>ФИО, телефон, email, геолокация, фото, IP, логи.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Правовые основания</h2>
              <p>
                Обработка ведется с согласия субъектов ПД и на основании договоров с клиентами.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Меры защиты</h2>
              <p>
                Хранение данных на серверах REG.RU (РФ), защита HTTPS, разграничение доступа, 
                резервное копирование, назначен ответственный.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Контакты</h2>
              <p>
                <a href="mailto:info@fieldcontrol.ru" className="text-primary hover:underline">
                  info@fieldcontrol.ru
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

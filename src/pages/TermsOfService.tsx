import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Пользовательское соглашение Field Control</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Общие положения</h2>
              <p>
                Настоящее Соглашение определяет условия использования сервиса FieldControl Контроль 
                персонала, принадлежащего ИП Шевцову К. В.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Предмет</h2>
              <p>
                Оператор предоставляет доступ к облачному продукту для учёта и анализа выездных заявок 
                и маршрутов сотрудников.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Ответственность за персональные данные сотрудников</h2>
              <p>
                Клиент обязуется получать согласие своих сотрудников на передачу данных. Оператор не 
                несёт ответственности за законность получения данных Клиентом.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Оплата</h2>
              <p>
                Использование сервиса по модели подписки, оплата через ЮKassa, Т-Банк, СБП.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Контакты</h2>
              <p>
                ИП Шевцов К. В., <a href="mailto:info@fieldcontrol.ru" className="text-primary hover:underline">
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

export default TermsOfService;

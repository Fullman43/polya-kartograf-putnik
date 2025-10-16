import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Consent = () => {
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
          <h1 className="text-3xl font-bold mb-6">Согласие на обработку персональных данных</h1>
          
          <div className="space-y-6 text-gray-700">
            <p>
              Я, пользователь сервиса FieldControl Контроль персонала, даю согласие ИП Шевцову К. В. 
              на обработку моих персональных данных: ФИО, телефон, email, фото, геолокация и логи, 
              в целях предоставления сервиса.
            </p>
            
            <p>
              С <a href="/privacy-policy" className="text-primary hover:underline">
                политикой обработки персональных данных
              </a> ознакомлен.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Consent;

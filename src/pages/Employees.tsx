import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin } from "lucide-react";

const Employees = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: employees } = useEmployees();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  if (!user) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-success">В сети</Badge>;
      case "busy":
        return <Badge className="bg-warning">Занят</Badge>;
      case "offline":
        return <Badge variant="secondary">Не в сети</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Сотрудники</h1>
          <p className="text-muted-foreground">Управление персоналом и мониторинг статуса</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {employees?.map((employee) => (
            <Card key={employee.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{employee.full_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(employee.status)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {employee.current_location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Местоположение доступно</span>
                  </div>
                )}
                {employee.current_task_id && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Текущая задача: </span>
                    <span className="font-medium">В работе</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {(!employees || employees.length === 0) && (
            <Card className="col-span-full">
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Сотрудники не найдены</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Employees;
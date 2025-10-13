import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTasks } from "@/hooks/useTasks";
import { useEmployees } from "@/hooks/useEmployees";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Reports = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: tasks } = useTasks();
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

  // Статистика по статусам задач
  const tasksByStatus = tasks?.reduce((acc, task) => {
    const status = task.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(tasksByStatus || {}).map(([name, value]) => ({
    name: name === "pending" ? "Ожидает" :
          name === "assigned" ? "Назначена" :
          name === "in_progress" ? "В процессе" :
          name === "completed" ? "Выполнена" : "Отменена",
    value,
  }));

  // Статистика по сотрудникам
  const tasksByEmployee = tasks?.reduce((acc, task) => {
    if (task.assigned_employee_id) {
      const employee = employees?.find(e => e.id === task.assigned_employee_id);
      const name = employee?.full_name || "Неизвестно";
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const employeeData = Object.entries(tasksByEmployee || {}).map(([name, tasks]) => ({
    name,
    tasks,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Общая статистика
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === "completed").length || 0;
  const activeTasks = tasks?.filter(t => t.status === "in_progress").length || 0;
  const pendingTasks = tasks?.filter(t => t.status === "pending").length || 0;
  const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0;

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Отчеты и аналитика</h1>
          <p className="text-muted-foreground">Статистика работы и выполнения задач</p>
        </div>

        {/* Общая статистика */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Всего задач</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Выполнено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{completedTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">В работе</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{activeTasks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Процент выполнения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{completionRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Графики */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Распределение задач по статусам</CardTitle>
              <CardDescription>Текущее состояние всех задач</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Задачи по сотрудникам</CardTitle>
              <CardDescription>Количество назначенных задач на каждого сотрудника</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="#0088FE" name="Задачи" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Список задач в ожидании */}
        <Card>
          <CardHeader>
            <CardTitle>Задачи в ожидании</CardTitle>
            <CardDescription>Задачи, которые требуют назначения или внимания</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTasks > 0 ? (
              <div className="space-y-2">
                {tasks?.filter(t => t.status === "pending").slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{task.work_type}</p>
                      <p className="text-sm text-muted-foreground">{task.address}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(task.scheduled_time).toLocaleString("ru-RU")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Нет задач в ожидании</p>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Reports;
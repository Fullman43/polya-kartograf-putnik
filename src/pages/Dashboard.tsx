import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Users, MapPin, LogOut, LayoutDashboard, ClipboardList, UserCircle } from "lucide-react";
import MapView from "@/components/dashboard/MapView";
import TaskListReal from "@/components/dashboard/TaskListReal";
import EmployeeListReal from "@/components/dashboard/EmployeeListReal";
import { CreateTaskDialog } from "@/components/dashboard/CreateTaskDialog";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-sidebar-foreground mb-1">
                Контроль персонала
              </h1>
              <p className="text-sm text-sidebar-foreground/70">Панель оператора</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="Выход"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-2 border-b border-sidebar-border">
          <p className="text-xs font-semibold text-sidebar-foreground/70 mb-2">Навигация</p>
          <nav className="space-y-1">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
              size="sm"
            >
              <LayoutDashboard className="h-4 w-4" />
              Панель управления
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
              size="sm"
            >
              <ClipboardList className="h-4 w-4" />
              Все задачи
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
              size="sm"
            >
              <UserCircle className="h-4 w-4" />
              Сотрудники
            </Button>
          </nav>
        </div>

        <div className="p-4 space-y-2">
          <Button 
            className="w-full justify-start gap-2" 
            size="lg"
            onClick={() => setShowCreateTask(true)}
          >
            <Plus className="h-5 w-5" />
            Создать задачу
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            size="lg"
          >
            <Filter className="h-5 w-5" />
            Фильтры
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
              <Users className="h-4 w-4" />
              Сотрудники
            </div>
          </div>
          <EmployeeListReal />

          <div className="px-4 py-2 mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
              <MapPin className="h-4 w-4" />
              Активные задачи
            </div>
          </div>
          <TaskListReal />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <MapView />
      </main>

      <CreateTaskDialog open={showCreateTask} onOpenChange={setShowCreateTask} />
    </div>
  );
};

export default Dashboard;

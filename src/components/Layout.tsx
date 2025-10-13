import { ReactNode, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Filter, Users, MapPin, LogOut, LayoutDashboard, ClipboardList, UserCircle, FileText, UserPlus } from "lucide-react";
import TaskListReal from "@/components/dashboard/TaskListReal";
import EmployeeListReal from "@/components/dashboard/EmployeeListReal";
import { CreateTaskDialog } from "@/components/dashboard/CreateTaskDialog";
import { CreateEmployeeDialog } from "@/components/dashboard/CreateEmployeeDialog";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateEmployee, setShowCreateEmployee] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  title="Профиль"
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Мой профиль</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-2 border-b border-sidebar-border">
          <p className="text-xs font-semibold text-sidebar-foreground/70 mb-2">Навигация</p>
          <nav className="space-y-1">
            <Link to="/dashboard">
              <Button 
                variant="ghost" 
                className={`w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent ${
                  location.pathname === "/dashboard" ? "bg-sidebar-accent" : ""
                }`}
                size="sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                Панель управления
              </Button>
            </Link>
            <Link to="/tasks">
              <Button 
                variant="ghost" 
                className={`w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent ${
                  location.pathname === "/tasks" ? "bg-sidebar-accent" : ""
                }`}
                size="sm"
              >
                <ClipboardList className="h-4 w-4" />
                Все задачи
              </Button>
            </Link>
            <Link to="/employees">
              <Button 
                variant="ghost" 
                className={`w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent ${
                  location.pathname === "/employees" ? "bg-sidebar-accent" : ""
                }`}
                size="sm"
              >
                <Users className="h-4 w-4" />
                Сотрудники
              </Button>
            </Link>
            <Link to="/reports">
              <Button 
                variant="ghost" 
                className={`w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent ${
                  location.pathname === "/reports" ? "bg-sidebar-accent" : ""
                }`}
                size="sm"
              >
                <FileText className="h-4 w-4" />
                Отчеты
              </Button>
            </Link>
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
                <Users className="h-4 w-4" />
                Сотрудники
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateEmployee(true)}
                title="Добавить сотрудника"
                className="gap-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span className="text-xs">Добавить</span>
              </Button>
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
      <main className="flex-1 flex flex-col overflow-auto">
        {children}
      </main>

      <CreateTaskDialog open={showCreateTask} onOpenChange={setShowCreateTask} />
      <CreateEmployeeDialog open={showCreateEmployee} onOpenChange={setShowCreateEmployee} />
    </div>
  );
};

export default Layout;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Users, MapPin } from "lucide-react";
import MapView from "@/components/dashboard/MapView";
import TaskList from "@/components/dashboard/TaskList";
import EmployeeList from "@/components/dashboard/EmployeeList";
import { CreateTaskDialog } from "@/components/dashboard/CreateTaskDialog";

const Dashboard = () => {
  const [showCreateTask, setShowCreateTask] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-foreground mb-1">
            Контроль персонала
          </h1>
          <p className="text-sm text-sidebar-foreground/70">Панель оператора</p>
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
          <EmployeeList />

          <div className="px-4 py-2 mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-sidebar-foreground">
              <MapPin className="h-4 w-4" />
              Активные задачи
            </div>
          </div>
          <TaskList />
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

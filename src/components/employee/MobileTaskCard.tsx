import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Phone, User } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { translateWorkType } from "@/lib/utils";

type Task = Database['public']['Tables']['tasks']['Row'];

interface MobileTaskCardProps {
  task: Task;
  isActive?: boolean;
  children?: React.ReactNode;
}

export const MobileTaskCard = ({ 
  task, 
  isActive, 
  children 
}: MobileTaskCardProps) => {
  const getStatusBadge = () => {
    const statusMap = {
      in_progress: { label: 'В работе', className: 'bg-warning' },
      en_route: { label: 'В пути', className: 'bg-info' },
      completed: { label: 'Завершена', className: 'bg-success' },
      pending: { label: 'Ожидает', className: 'bg-secondary' },
      assigned: { label: 'Назначена', className: 'bg-secondary' },
    };
    
    return statusMap[task.status] || statusMap.pending;
  };

  return (
    <Card className={`p-4 active:scale-[0.98] transition-transform ${isActive ? 'border-primary border-2' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold mb-1 truncate">{translateWorkType(task.work_type)}</h3>
        </div>
        <Badge className={getStatusBadge().className}>
          {getStatusBadge().label}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground line-clamp-2">{task.address}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            {new Date(task.scheduled_time).toLocaleString("ru-RU", {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {task.customer_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground truncate">{task.customer_name}</span>
          </div>
        )}

        {task.customer_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <a 
              href={`tel:${task.customer_phone}`} 
              className="text-primary hover:underline truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {task.customer_phone}
            </a>
          </div>
        )}
      </div>

      {task.description && (
        <div className="mt-3 p-2 bg-muted rounded text-sm line-clamp-2">
          {task.description}
        </div>
      )}

      {children && (
        <div className="mt-4 space-y-2">
          {children}
        </div>
      )}
    </Card>
  );
};

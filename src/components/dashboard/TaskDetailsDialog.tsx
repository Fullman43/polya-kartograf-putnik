import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useTaskPhotos } from "@/hooks/useTaskPhotos";
import { Clock, MapPin, MessageSquare, Camera } from "lucide-react";
import type { Task } from "@/hooks/useTasks";
import { translateWorkType } from "@/lib/utils";

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskDetailsDialog = ({ task, open, onOpenChange }: TaskDetailsDialogProps) => {
  const { data: comments } = useTaskComments(task?.id || "");
  const { data: photos } = useTaskPhotos(task?.id || "");

  console.log('TaskDetailsDialog - task:', task?.id, 'photos:', photos);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Детали заявки #{task.order_number}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Task Info */}
          <Card className="p-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Тип работы</p>
                <p className="font-medium">{translateWorkType(task.work_type)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Адрес</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p>{task.address}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Время</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p>{new Date(task.scheduled_time).toLocaleString("ru-RU")}</p>
                </div>
              </div>

              {task.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Описание</p>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}

              {task.customer_name && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Клиент</p>
                  <p>{task.customer_name}</p>
                  {task.customer_phone && (
                    <a href={`tel:${task.customer_phone}`} className="text-sm text-primary hover:underline">
                      {task.customer_phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Comments */}
          {comments && comments.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                <h3 className="font-semibold">Комментарии</h3>
                <Badge variant="secondary">{comments.length}</Badge>
              </div>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">{comment.comment}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.created_at).toLocaleString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Photos */}
          {photos && photos.length > 0 ? (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Camera className="h-4 w-4" />
                <h3 className="font-semibold">Фото отчёт</h3>
                <Badge variant="secondary">{photos.length}</Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((photo) => {
                  console.log('Rendering photo:', photo.id, 'url:', photo.photo_url);
                  return (
                    <a
                      key={photo.id}
                      href={photo.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity border-2 border-border"
                    >
                      <img
                        src={photo.photo_url}
                        alt="Фото задачи"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', photo.photo_url);
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EОшибка%3C/text%3E%3C/svg%3E';
                        }}
                        onLoad={() => console.log('Image loaded successfully:', photo.photo_url)}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                        {new Date(photo.created_at).toLocaleString("ru-RU")}
                      </div>
                    </a>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">
                Нет загруженных фотографий
              </p>
            </Card>
          )}

          {(!comments || comments.length === 0) && (!photos || photos.length === 0) && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                Комментарии и фото отчёты отсутствуют
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

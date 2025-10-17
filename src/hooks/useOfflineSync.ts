import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QueuedAction {
  id: string;
  type: 'status_update' | 'comment' | 'photo' | 'location';
  data: any;
  timestamp: number;
}

const QUEUE_KEY = 'fieldcontrol_offline_queue';

export const useOfflineSync = () => {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load queue from localStorage
  useEffect(() => {
    const savedQueue = localStorage.getItem(QUEUE_KEY);
    if (savedQueue) {
      setQueue(JSON.parse(savedQueue));
    }
  }, []);

  // Save queue to localStorage
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Подключение восстановлено',
        description: 'Синхронизация данных...',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Нет подключения',
        description: 'Данные будут синхронизированы при восстановлении связи',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const addToQueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const newAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };

    setQueue(prev => [...prev, newAction]);

    if (!isOnline) {
      toast({
        title: 'Действие сохранено',
        description: 'Будет выполнено при восстановлении связи',
      });
    }

    return newAction.id;
  }, [isOnline, toast]);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => prev.filter(action => action.id !== id));
  }, []);

  const processQueue = useCallback(async (processor: (action: QueuedAction) => Promise<boolean>) => {
    if (!isOnline || isSyncing || queue.length === 0) {
      return;
    }

    setIsSyncing(true);

    try {
      const results = await Promise.all(
        queue.map(async (action) => {
          try {
            const success = await processor(action);
            if (success) {
              removeFromQueue(action.id);
            }
            return success;
          } catch (error) {
            console.error('Failed to process action:', error);
            return false;
          }
        })
      );

      const successCount = results.filter(Boolean).length;
      
      if (successCount > 0) {
        toast({
          title: 'Синхронизация завершена',
          description: `Синхронизировано действий: ${successCount}`,
        });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queue, removeFromQueue, toast]);

  return {
    queue,
    isOnline,
    isSyncing,
    addToQueue,
    removeFromQueue,
    processQueue,
  };
};

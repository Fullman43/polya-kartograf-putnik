import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setShowReload(true);
                
                toast({
                  title: 'Доступно обновление',
                  description: 'Новая версия приложения готова к установке',
                  duration: 10000,
                });
              }
            });
          }
        });
      });

      // Listen for controlling service worker change
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, [toast]);

  const reloadPage = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return {
    showReload,
    reloadPage,
  };
};

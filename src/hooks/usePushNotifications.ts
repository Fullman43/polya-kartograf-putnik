import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY'; // TODO: Generate VAPID keys

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const requestPermission = async () => {
    if (!isSupported) {
      toast({
        title: 'Уведомления не поддерживаются',
        description: 'Ваш браузер не поддерживает push-уведомления',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToPush();
        return true;
      } else {
        toast({
          title: 'Разрешение не предоставлено',
          description: 'Вы не будете получать уведомления о новых задачах',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось запросить разрешение на уведомления',
        variant: 'destructive',
      });
      return false;
    }
  };

  const subscribeToPush = async () => {
    if (!isSupported || permission !== 'granted') {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      let sub = await registration.pushManager.getSubscription();
      
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      setSubscription(sub);

      // Save subscription to database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const subscriptionJSON = sub.toJSON();
        const deviceId = localStorage.getItem('device_id') || crypto.randomUUID();
        localStorage.setItem('device_id', deviceId);

        await supabase.from('device_tokens').upsert({
          user_id: user.id,
          device_id: deviceId,
          endpoint: subscriptionJSON.endpoint || '',
          p256dh: subscriptionJSON.keys?.p256dh || '',
          auth: subscriptionJSON.keys?.auth || '',
          platform: 'web',
          last_used_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,device_id'
        });

        toast({
          title: 'Уведомления включены',
          description: 'Вы будете получать уведомления о новых задачах',
        });
      }

      return sub;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: 'Ошибка подписки',
        description: 'Не удалось настроить push-уведомления',
        variant: 'destructive',
      });
      return null;
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) {
      return;
    }

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove from database
      const deviceId = localStorage.getItem('device_id');
      if (deviceId) {
        await supabase
          .from('device_tokens')
          .delete()
          .eq('device_id', deviceId);
      }

      toast({
        title: 'Уведомления отключены',
        description: 'Вы больше не будете получать уведомления',
      });
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  };

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
  };
};

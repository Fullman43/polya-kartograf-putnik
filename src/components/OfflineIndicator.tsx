import { WifiOff, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';

export const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <Badge variant="destructive" className="fixed top-4 right-4 z-50 gap-2 animate-fade-in">
      <WifiOff className="w-3 h-3" />
      Офлайн режим
    </Badge>
  );
};

export const OnlineIndicator = ({ className }: { className?: string }) => {
  const { isOnline } = usePWA();

  return (
    <div className={className}>
      {isOnline ? (
        <Badge variant="outline" className="gap-2">
          <Wifi className="w-3 h-3 text-green-500" />
          Онлайн
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-2">
          <WifiOff className="w-3 h-3 text-destructive" />
          Офлайн
        </Badge>
      )}
    </div>
  );
};

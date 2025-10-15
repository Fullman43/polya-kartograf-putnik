import { createContext, useContext, ReactNode } from 'react';

interface MapContextType {
  focusOnEmployee: (employeeId: string) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    return {
      focusOnEmployee: () => {}, // Fallback for when context is not available
    };
  }
  return context;
};

interface MapProviderProps {
  children: ReactNode;
  value: MapContextType;
}

export const MapProvider = ({ children, value }: MapProviderProps) => {
  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

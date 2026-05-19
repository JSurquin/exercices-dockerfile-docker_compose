'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type TourModeContextValue = {
  isTourMode: boolean;
  startTour: () => void;
  endTour: () => void;
};

const TourModeContext = createContext<TourModeContextValue>({
  isTourMode: false,
  startTour: () => {},
  endTour: () => {},
});

export function TourModeProvider({ children }: { children: React.ReactNode }) {
  const [isTourMode, setIsTourMode] = useState(false);

  const startTour = useCallback(() => setIsTourMode(true), []);
  const endTour = useCallback(() => setIsTourMode(false), []);

  return (
    <TourModeContext.Provider value={{ isTourMode, startTour, endTour }}>
      {children}
    </TourModeContext.Provider>
  );
}

export function useTourMode() {
  return useContext(TourModeContext);
}

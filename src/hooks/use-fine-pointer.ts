'use client';

import { useEffect, useState } from 'react';

export function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    const hoverQuery = window.matchMedia('(hover: hover)');
    const pointerQuery = window.matchMedia('(pointer: fine)');
    const update = () => {
      setFine(hoverQuery.matches && pointerQuery.matches);
    };
    update();
    hoverQuery.addEventListener('change', update);
    pointerQuery.addEventListener('change', update);
    return () => {
      hoverQuery.removeEventListener('change', update);
      pointerQuery.removeEventListener('change', update);
    };
  }, []);

  return fine;
}

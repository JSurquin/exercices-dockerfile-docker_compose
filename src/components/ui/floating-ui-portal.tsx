'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Conteneur viewport-fixe pour les boutons flottants (chat, scroll-to-top).
 * Évite qu'un scroll-lock sur body ne casse position:fixed sur les enfants directs.
 */
export function FloatingUiPortal({ children }: { children: ReactNode }) {
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMountNode(document.body);
  }, []);

  if (!mountNode) return null;

  return createPortal(
    <div
      data-floating-ui-root
      className="pointer-events-none fixed bottom-0 right-0 z-[99990] size-0 overflow-visible"
      aria-hidden={false}
    >
      {children}
    </div>,
    mountNode,
  );
}

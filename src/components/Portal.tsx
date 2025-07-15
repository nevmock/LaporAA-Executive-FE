import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  containerId?: string;
}

export default function Portal({ children, containerId = 'portal-root' }: PortalProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Try to find existing container
    let portalContainer = document.getElementById(containerId);
    
    // If not found, create it
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = containerId;
      portalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 999999;
      `;
      document.body.appendChild(portalContainer);
    }
    
    setContainer(portalContainer);
    
    // Cleanup function
    return () => {
      // Only remove if we created it and it's empty
      if (portalContainer && portalContainer.children.length === 0 && portalContainer.id === containerId) {
        document.body.removeChild(portalContainer);
      }
    };
  }, [containerId]);

  return container ? createPortal(children, container) : null;
}

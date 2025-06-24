import { useEffect, useState } from 'react';

interface NoSSRProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Component to prevent server-side rendering of children
 * Useful for components that depend on browser APIs or have hydration issues
 */
export default function NoSSR({ children, fallback = null }: NoSSRProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

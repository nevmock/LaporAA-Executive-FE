'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
    const router = useRouter();

    useEffect(() => {
        // Only check auth on client side
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem("token");
            if (!token) {
                router.replace("/login");
            }
        }
    }, [router]); // Added missing dependency
};

// src/app/(auth)/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LAPOR AA | Login',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            {children}
        </div>
    );
}

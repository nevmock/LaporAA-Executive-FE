import './globals.css';
import type { Metadata } from 'next';
import { SocketProvider } from '../contexts/SocketContext';
import ErrorBoundary from '../components/ErrorBoundary';

export const metadata: Metadata = {
    description: 'Selamat Dadang di Lapor AA, Aplikasi Pengaduan Masyarakat',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <body className="bg-gray-100 h-screen" suppressHydrationWarning>
                <ErrorBoundary>
                    <SocketProvider>
                        {children}
                    </SocketProvider>
                </ErrorBoundary>
            </body>
        </html>
    );
}

// src/app/layout.tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <body className="bg-gray-100 h-auto">
                {children}
            </body>
        </html>
    );
}

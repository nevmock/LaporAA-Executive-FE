import './globals.css';
import "leaflet/dist/leaflet.css";
import React from "react";
import AppShell from "./AppShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <body className="bg-gray-100" suppressHydrationWarning>
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
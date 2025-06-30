'use client';

import "../globals.css";
// import "leaflet/dist/leaflet.css"; // Moved to globals.css
import AppShell from "../AppShell";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    useAuth();

    return (
        <AppShell>
            {children}
        </AppShell>
    );
}

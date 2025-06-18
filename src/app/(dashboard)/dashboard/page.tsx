// app/dashboard/page.tsx
import type { Metadata } from 'next';
import Home from './Home';

export const metadata: Metadata = {
    title: 'LAPOR AA | Dashboard',
};

export default function DashboardPage() {
    return <Home />;
}

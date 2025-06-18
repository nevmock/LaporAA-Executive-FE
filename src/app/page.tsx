// app/page.tsx
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'LAPOR AA | Selamat datang di Dashboard Lapor AA',
};

export default function HomePage() {
  return <HomeClient />;
}

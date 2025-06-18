// app/dashboard/page.tsx
import type { Metadata } from 'next';
import Pengaduan from './Pengaduan';

export const metadata: Metadata = {
  title: 'LAPOR AA | Pengaduan',
};

export default function Page() {
  return <Pengaduan />;
}

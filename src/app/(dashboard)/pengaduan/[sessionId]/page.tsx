import type { Metadata } from 'next';
import Laporan from './Laporan';

export async function generateMetadata({ params }: { params: { sessionId: string } }): Promise<Metadata> {
    try {
        const sessionId = params.sessionId;
        const url = `${process.env.BASE_URL_SERVER}/user/public-reports/${sessionId}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        const nama = data?.user?.name || 'Warga Kabupaten Bekasi';

        return {
            title: `LAPOR AA | ${nama}`,
            description: `Detail pengaduan dari ${nama}`,
        };
    } catch (err) {
        console.error('❌ Gagal ambil metadata laporan:', err);
        return {
            title: 'LAPOR AA | Laporan',
            description: 'Detail pengaduan masyarakat.',
        };
    }
}

export default function Page() {
    return <Laporan />;
}
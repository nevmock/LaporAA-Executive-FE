import type { Metadata } from 'next';
import Laporan from './Laporan';

export async function generateMetadata(props: { params: Promise<{ sessionId: string }> }): Promise<Metadata> {
    const params = await props.params;
    const sessionId = params.sessionId;

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/user/public-reports/${sessionId}`, {
            cache: 'no-store',
        });

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
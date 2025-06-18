// Hapus semuanya, cukup:
import { Metadata } from 'next/dist/lib/metadata/types/metadata-interface';
import Laporan from './Laporan';

export async function generateMetadata(props: { params: { sessionId: string } }) {
    const { params } = await Promise.resolve(props);
    const sessionId = params.sessionId;

    const res = await fetch(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/user/public-reports/${sessionId}`, {
        cache: 'no-store',
    });

    try {
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

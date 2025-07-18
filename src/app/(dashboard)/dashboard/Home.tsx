'use client';
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';

const BarOpdChart = dynamic(() => import('../../../components/dashboard/BarOpdChart'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const BarWilayahChartKecamatan = dynamic(() => import('../../../components/dashboard/BarWilayahChartKecamatan'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const FullScreen = dynamic(() => import('../../../components/dashboard/FullScreen'), { ssr: false });
const LineChart = dynamic(() => import('../../../components/dashboard/LineChart'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const MapPersebaran = dynamic(() => import('../../../components/dashboard/MapPersebaran'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const SummaryPieChart = dynamic(() => import('../../../components/dashboard/SummaryPieChart'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const SummaryTable = dynamic(() => import('../../../components/dashboard/SummaryTable'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Home() {
  const router = useRouter();
  // const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  if (isCheckingAuth) return <div>Loading...</div>;

  return (
    <div className="pt-3">
      {/* Section Header */}
      
      <div className="w-full min-h-screen overflow-y-auto bg-white px-3 pb-6 space-y-6">

        {/* Summary Table */}
        <div className="w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <SummaryTable/>
        </div>

        {/* Ringkasan Pie & Line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FullScreen title="Ringkasan Status Laporan">
            <SummaryPieChart />
          </FullScreen>
          <FullScreen title="Grafik Tren Laporan">
            <LineChart />
          </FullScreen>
        </div>

        {/* Peta Persebaran */}
        <FullScreen title="Peta Persebaran">
          <MapPersebaran />
        </FullScreen>

        {/* Bar Wilayah & OPD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FullScreen title="Laporan per Kecamatan">
            <BarWilayahChartKecamatan />
          </FullScreen>
          <FullScreen title="Laporan per Perangkat Daerah">
            <BarOpdChart />
          </FullScreen>
        </div>
      </div>
    </div>
  );
}

'use client';
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';

// Legacy chart components
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
const SummaryPieChart = dynamic(() => import('../../../components/dashboard/SummaryPieChart'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});

// New real-time components
const LiveStats = dynamic(() => import('../../../components/dashboard/LiveStats'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const LiveMapUpdates = dynamic(() => import('../../../components/dashboard/LiveMapUpdates'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const LiveChartWrapper = dynamic(() => import('../../../components/dashboard/LiveChartWrapper'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const LiveReportFeed = dynamic(() => import('../../../components/dashboard/LiveReportFeed'), { 
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
      <div className="w-full min-h-screen overflow-y-auto bg-white px-3 pb-6 space-y-6">

        {/* Real-time Summary Table */}
        <div className="w-full bg-white border border-gray-200 rounded-lg shadow-md">
          <LiveStats />
        </div>

        {/* Real-time Activity Feed */}
        <div className="w-full">
          <LiveReportFeed className="h-96" />
        </div>

        {/* Real-time Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FullScreen title="Ringkasan Status Laporan">
            <LiveChartWrapper chartType="pie" title="Ringkasan Status Laporan">
              <SummaryPieChart />
            </LiveChartWrapper>
          </FullScreen>
          <FullScreen title="Grafik Tren Laporan">
            <LiveChartWrapper chartType="line" title="Grafik Tren Laporan">
              <LineChart />
            </LiveChartWrapper>
          </FullScreen>
        </div>

        {/* Real-time Map */}
        <FullScreen title="Peta Persebaran">
          <LiveMapUpdates />
        </FullScreen>

        {/* Real-time Bar Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FullScreen title="Laporan per Kecamatan">
            <LiveChartWrapper chartType="bar_wilayah" title="Laporan per Kecamatan">
              <BarWilayahChartKecamatan />
            </LiveChartWrapper>
          </FullScreen>
          <FullScreen title="Laporan per Perangkat Daerah">
            <LiveChartWrapper chartType="bar_opd" title="Laporan per Perangkat Daerah">
              <BarOpdChart />
            </LiveChartWrapper>
          </FullScreen>
        </div>
      </div>
    </div>
  );
}

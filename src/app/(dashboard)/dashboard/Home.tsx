'use client';
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';

// Modern dashboard components - organized by type
const SummaryTable = dynamic(() => import('../../../components/dashboard/tables/SummaryTable'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
});
const BarOpdChart = dynamic(() => import('../../../components/dashboard/charts/BarOpdChart'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
});
const BarWilayahChartKecamatan = dynamic(() => import('../../../components/dashboard/charts/BarWilayahChartKecamatan'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
});
const LineChart = dynamic(() => import('../../../components/dashboard/charts/LineChart'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
});
const SummaryPieChart = dynamic(() => import('../../../components/dashboard/charts/SummaryPieChart'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64"></div>
});
const MapPersebaranCard = dynamic(() => import('../../../components/dashboard/maps/MapPersebaranCard'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
});
const ConnectionStatus = dynamic(() => import('../../../components/socket/ConnectionStatus'), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-8 w-32"></div>
});

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Connection Status - Top right corner */}
        <div className="flex justify-end mb-4">
          <ConnectionStatus 
            showText={true} 
            showDetails={false} 
            size="sm" 
            className="shadow-sm"
          />
        </div>

        {/* Stats and Summary Section */}
        <SummaryTable />

        {/* Charts Grid - Top Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Summary Pie Chart */}
          <SummaryPieChart />
          
          {/* Line Chart */}
          <LineChart />
        </div>

        {/* Map Section */}
        <MapPersebaranCard />

        {/* Charts Grid - Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Bar Chart Wilayah */}
          <BarWilayahChartKecamatan />
          
          {/* Bar Chart OPD */}
          <BarOpdChart />
        </div>
      </div>
    </div>
  );
}

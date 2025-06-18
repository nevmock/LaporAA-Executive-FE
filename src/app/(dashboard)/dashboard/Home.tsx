'use client';
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import axios from "../../../utils/axiosInstance";

import SummaryTable from './components/SummaryTable';
import SummaryPieChart from './components/SummaryPieChart';
import LineChart from './components/LineChart';
import BarWilayahChartKecamatan from './components/BarWilayahChartKecamatan';
import BarOpdChart from './components/BarOpdChart';
import FullScreen from "./components/FullScreen";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const MapPersebaran = dynamic(() => import('./components/MapPersebaran'), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    axios.get(`${API_URL}/reports/summary`)
      .then((res) => setStatusCounts(res.data || {}))
      .catch(() => setStatusCounts({}));
  }, []);

  if (isCheckingAuth) return null;

  return (
    <div>
      {/* Section Header */}
      <div className="bg-white px-6 py-4 shadow">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Lapor AA</h2>
      </div>

      <div className="w-full min-h-screen overflow-y-auto bg-white p-6 space-y-6">

        {/* Summary Table */}
        <div className="w-full">
          <SummaryTable statusCounts={statusCounts} />
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

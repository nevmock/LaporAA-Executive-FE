'use client';
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import axios from "../../../utils/axiosInstance";

const BarOpdChart = dynamic(() => import('../../../components/dashboard/BarOpdChart'), { ssr: false });
const BarWilayahChartKecamatan = dynamic(() => import('../../../components/dashboard/BarWilayahChartKecamatan'), { ssr: false });
const FullScreen = dynamic(() => import('../../../components/dashboard/FullScreen'), { ssr: false });
const LineChart = dynamic(() => import('../../../components/dashboard/LineChart'), { ssr: false });
const MapPersebaran = dynamic(() => import('../../../components/dashboard/MapPersebaran'), { ssr: false });
const SummaryPieChart = dynamic(() => import('../../../components/dashboard/SummaryPieChart'), { ssr: false });
const SummaryTable = dynamic(() => import('../../../components/dashboard/SummaryTable'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

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

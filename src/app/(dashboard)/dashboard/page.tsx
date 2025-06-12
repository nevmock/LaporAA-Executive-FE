'use client';
import dynamic from 'next/dynamic';
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import axios from "../../../utils/axiosInstance"; // Ganti import axios

import LeaderBoardCard from './components/LeaderBoardCard';
import BarchartsOpd from './components/BarchartsOpd';
import EfisiensiCard from './components/EfisiensiCard';
import EffectivenessCard from './components/EffectivenessCard';
import SpedoChart from './components/SpedoChart';
import HorizontalBarWilayahChart from './components/BarWilayahChart';
import LineChart from './components/LineChart';
import DistribusiCard from './components/DistribusiCard';
import KepuasanCard from './components/KepuasanCard';

import SummaryTable from './components/SummaryTable';
import SummaryPieChart from './components/SummaryPieChart';

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const MapPersebaran = dynamic(() => import('./components/MapPersebaran'), {
  ssr: false,
});

export default function Home() {
  const [countPending, setCountPending] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Tambah state ini
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsCheckingAuth(false); // Hanya lanjut render jika sudah cek token
    }
  }, [router]);

  useEffect(() => {
    axios.get(`${API_URL}/reports/summary`)
      .then((res) => setStatusCounts(res.data || {}))
      .catch(() => setStatusCounts({}));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/reportCount`)
      .then((res) => {
        const data = res.data?.count ?? 0;
        console.info('Jumlah laporan:', data);
        setCountPending(data);
      })
      .catch((err) => {
        console.error('Gagal mengambil jumlah laporan:', err);
        setCountPending(0);
      });
  }, []);

  if (isCheckingAuth) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 ml-3 mt-3">
        Dashboard Lapor AA
      </h2>

      <div className="w-full min-h-screen overflow-y-auto bg-white p-6 space-y-6">
        {/* <div className="drop-shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto">
        <div className="space-y-4">
          <div className="drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]">
            <EfisiensiCard />
          </div>
          <div className="drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]">
            <EffectivenessCard />
          </div>
        </div>

        <div className="space-y-4">
          <div className="drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]">
            <DistribusiCard />
          </div>
          <div className="drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]">
            <KepuasanCard />
          </div>
        </div>
      </div> */}

        {/* Summary Table - full width */}
        <div className="w-full">
          <SummaryTable statusCounts={statusCounts} />
        </div>

        {/* Pie Chart + KPI Cards */}
        <div className="drop-shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto">

          <div className="rounded-xl drop-shadow-lg">
            <SummaryPieChart />
          </div>
          <div className="rounded-xl drop-shadow-lg h-auto bg-gray-200 overflow-hidden flex">
            <LineChart />
          </div>

        </div>

        {/* Line Chart + Map */}
        <div className="drop-shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto">
          <div>
            <MapPersebaran />
          </div>

          <div className="rounded-xl drop-shadow-lg h-auto bg-gray-200 overflow-hidden flex">
            <HorizontalBarWilayahChart />
          </div>
        </div>
      </div>
    </div>
  );
}
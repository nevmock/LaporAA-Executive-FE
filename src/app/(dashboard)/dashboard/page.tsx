'use client';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

import LeaderBoardCard from './components/LeaderBoardCard';
import BarchartsOpd from './components/BarchartsOpd';
import EfisiensiCard from './components/EfisiensiCard';
import EffectivenessCard from './components/EffectivenessCard';
import SpedoChart from './components/SpedoChart';
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

  return (
    <div className="w-full min-h-screen overflow-y-auto bg-white p-6 space-y-6">

      {/* Summary Table - full width */}
      <div className="w-full">
        <SummaryTable statusCounts={statusCounts} />
      </div>

      {/* Pie Chart + KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="rounded-xl drop-shadow-lg">
          <SummaryPieChart statusCounts={statusCounts} />
        </div>
        <div className="bg-gray-200 rounded-xl drop-shadow-lg overflow-hidden h-[400px]">
          <MapPersebaran />
        </div>

      </div>

      {/* Line Chart + Map */}
      <div className="drop-shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto">
        <div>
          <LineChart />
        </div>

        <div className="space-y-4">
          <div className="drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]">
            <EfisiensiCard />
          </div>
          <div className="drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]">
            <EffectivenessCard />
          </div>
          <div className="drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]">
            <DistribusiCard />
          </div>
          <div className="drop-shadow-lg transition-transform duration-200 hover:scale-[1.03]">
            <KepuasanCard />
          </div>
        </div>

      </div>

      {/* BarChart OPD & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="drop-shadow-lg lg:col-span-2 min-w-[450px]">
          <BarchartsOpd />
        </div>
        <div className="drop-shadow-lg min-w-[150px]">
          <LeaderBoardCard />
        </div>
      </div>
    </div>
  );
}
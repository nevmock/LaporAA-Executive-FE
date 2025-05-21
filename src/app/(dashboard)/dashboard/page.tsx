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

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const MapPersebaran = dynamic(() => import('./components/MapPersebaran'), {
  ssr: false,
});

export default function Home() {
  const [countPending, setCountPending] = useState(0);

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
    <div className="w-full h-screen overflow-y-auto bg-white p-6 space-y-6">
      {/* Section atas: Spedo dan LineChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4 min-w-[300px]">
          {/* <SpedoChart /> */}
          <EfisiensiCard />
          <EffectivenessCard />
          <DistribusiCard />
          <KepuasanCard />
        </div>
        <div className="min-w-[300px]">
          <LineChart />
        </div>
      </div>

      {/* Peta Persebaran */}
      <div className="w-full bg-gray-200 rounded-xl shadow overflow-hidden h-[700px]">
        <MapPersebaran />
      </div>

      {/* BarChart OPD & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-[450px]">
          <BarchartsOpd />
        </div>
        <div className="min-w-[150px]">
          <LeaderBoardCard />
        </div>
      </div>
    </div>

  );
}

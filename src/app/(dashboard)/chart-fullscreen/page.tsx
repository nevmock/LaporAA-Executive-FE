'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import SummaryPieChart from '../../../components/dashboard/charts/SummaryPieChart';
import BarOpdChart from '../../../components/dashboard/charts/BarOpdChart';
import BarWilayahChartKecamatan from '../../../components/dashboard/charts/BarWilayahChartKecamatan';
import LineChart from '../../../components/dashboard/charts/LineChart';
import LiveMapUpdates from '../../../components/dashboard/widgets/LiveMapUpdates';
import { ModernChartCard } from '../../../components/dashboard/modern';
import { FiArrowLeft, FiMaximize2, FiMinimize2 } from 'react-icons/fi';

const CHART_COMPONENTS = {
  'summary-pie': {
    title: 'Distribusi Status Pengaduan',
    description: 'Ringkasan status pengaduan dalam bentuk pie chart',
    component: SummaryPieChart
  },
  'bar-opd': {
    title: 'Laporan per OPD',
    description: 'Grafik batang laporan berdasarkan organisasi perangkat daerah',
    component: BarOpdChart
  },
  'bar-wilayah': {
    title: 'Laporan per Wilayah',
    description: 'Grafik batang laporan berdasarkan wilayah kecamatan',
    component: BarWilayahChartKecamatan
  },
  'line-chart': {
    title: 'Tren Laporan',
    description: 'Grafik garis tren laporan dari waktu ke waktu',
    component: LineChart
  },
  'map-persebaran': {
    title: 'Peta Persebaran Laporan',
    description: 'Visualisasi geografis persebaran laporan pengaduan',
    component: LiveMapUpdates
  }
};

export default function ChartFullscreenPage() {
  const searchParams = useSearchParams();
  const chartType = searchParams.get('type') as keyof typeof CHART_COMPONENTS;
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const chartConfig = CHART_COMPONENTS[chartType];

  if (!chartConfig) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chart Not Found</h1>
          <p className="text-gray-600 mb-6">Chart yang diminta tidak ditemukan.</p>
          <button 
            onClick={() => window.close()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tutup Tab
          </button>
        </div>
      </div>
    );
  }

  const ChartComponent = chartConfig.component;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.close()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title="Tutup Tab"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{chartConfig.title}</h1>
              <p className="text-sm text-gray-600">{chartConfig.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <FiMinimize2 size={20} /> : <FiMaximize2 size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <div className="max-w-full mx-auto">
          {chartType === 'map-persebaran' ? (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <ChartComponent isFullscreen={true} />
              </div>
            </div>
          ) : (
            <ChartComponent />
          )}
        </div>
      </div>
    </div>
  );
}

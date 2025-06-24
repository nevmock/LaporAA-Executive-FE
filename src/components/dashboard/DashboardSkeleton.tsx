'use client';

import React from 'react';
import { SkeletonChart, SkeletonTable, SkeletonMap, SkeletonCard } from '../Skeleton';

export const SummaryTableSkeleton: React.FC = () => (
  <SkeletonTable rows={6} cols={5} />
);

export const SummaryPieChartSkeleton: React.FC = () => (
  <SkeletonChart type="pie" />
);

export const LineChartSkeleton: React.FC = () => (
  <SkeletonChart type="line" />
);

export const BarOpdChartSkeleton: React.FC = () => (
  <SkeletonChart type="bar" />
);

export const BarWilayahChartKecamatanSkeleton: React.FC = () => (
  <SkeletonChart type="bar" />
);

export const MapPersebaranSkeleton: React.FC = () => (
  <SkeletonMap />
);

export const FullScreenSkeleton: React.FC<{ title: string; children?: React.ReactNode }> = ({ 
  title, 
  children 
}) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-md">
    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
      <div className="h-6 bg-gray-200 animate-pulse rounded" style={{ width: '200px' }}>
        <span className="sr-only">{title}</span>
      </div>
      <div className="w-8 h-8 bg-gray-200 animate-pulse rounded" />
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

export const DashboardHomeSkeleton: React.FC = () => (
  <div className="pt-3">
    <div className="w-full min-h-screen overflow-y-auto bg-white px-3 pb-6 space-y-6">
      {/* Summary Table Skeleton */}
      <div className="w-full bg-white border border-gray-200 rounded-lg shadow-md">
        <SummaryTableSkeleton />
      </div>

      {/* Ringkasan Pie & Line Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FullScreenSkeleton title="Ringkasan Status Laporan">
          <SummaryPieChartSkeleton />
        </FullScreenSkeleton>
        <FullScreenSkeleton title="Grafik Tren Laporan">
          <LineChartSkeleton />
        </FullScreenSkeleton>
      </div>

      {/* Peta Persebaran Skeleton */}
      <FullScreenSkeleton title="Peta Persebaran">
        <MapPersebaranSkeleton />
      </FullScreenSkeleton>

      {/* Bar Wilayah & OPD Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FullScreenSkeleton title="Laporan per Kecamatan">
          <BarWilayahChartKecamatanSkeleton />
        </FullScreenSkeleton>
        <FullScreenSkeleton title="Laporan per Perangkat Daerah">
          <BarOpdChartSkeleton />
        </FullScreenSkeleton>
      </div>
    </div>
  </div>
);

import React from 'react';
import { 
  Skeleton, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonChart,
  SkeletonMap,
  SkeletonList
} from '../components/Skeleton';

// Example usage of various skeleton components
export default function SkeletonExamples() {
  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Skeleton Loading Examples</h1>
      
      {/* Basic Skeleton Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Basic Skeleton</h2>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <Skeleton width="200px" height="24px" />
          <Skeleton lines={3} />
          <div className="flex items-center space-x-4">
            <Skeleton circle width="40px" height="40px" />
            <div className="flex-1 space-y-2">
              <Skeleton width="60%" height="16px" />
              <Skeleton width="40%" height="14px" />
            </div>
          </div>
        </div>
      </section>

      {/* Card Skeleton */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Card Skeleton</h2>
        <SkeletonCard />
      </section>

      {/* Table Skeleton */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Table Skeleton</h2>
        <SkeletonTable rows={5} cols={4} />
      </section>

      {/* Chart Skeletons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Chart Skeletons</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonChart type="bar" />
          <SkeletonChart type="line" />
          <SkeletonChart type="pie" />
        </div>
      </section>

      {/* Map Skeleton */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Map Skeleton</h2>
        <SkeletonMap />
      </section>

      {/* List Skeleton */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">List Skeleton</h2>
        <SkeletonList items={5} />
      </section>
    </div>
  );
}

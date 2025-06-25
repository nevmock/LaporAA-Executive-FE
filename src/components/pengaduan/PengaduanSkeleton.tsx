'use client';

import React from 'react';
import { Skeleton, SkeletonList, SkeletonHeader, SkeletonProgressBar, SkeletonCard } from '../Skeleton';

export const LaporanListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {/* Search and Filter Skeleton */}
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Skeleton height="40px" width="100%" rounded />
        </div>
        <div className="flex gap-2">
          <Skeleton width="120px" height="40px" rounded />
          <Skeleton width="100px" height="40px" rounded />
          <Skeleton width="80px" height="40px" rounded />
        </div>
      </div>
    </div>

    {/* List Items Skeleton */}
    <SkeletonList items={8} />

    {/* Pagination Skeleton */}
    <div className="flex justify-center items-center space-x-2 mt-6">
      <Skeleton width="80px" height="32px" rounded />
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} width="32px" height="32px" rounded />
      ))}
      <Skeleton width="80px" height="32px" rounded />
    </div>
  </div>
);

export const LaporanDetailHeaderSkeleton: React.FC = () => (
  <header className="w-full bg-white border-b shadow-sm z-40">
    {/* User info section skeleton */}
    <div className="flex flex-col md:flex-row items-start md:items-center px-4 md:px-8 py-3 justify-between gap-2 md:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <Skeleton width="40px" height="40px" rounded />
        <Skeleton circle width="40px" height="40px" />
        <div className="flex flex-col min-w-0 space-y-1">
          <Skeleton height="16px" width="150px" />
          <Skeleton height="12px" width="100px" />
        </div>
      </div>
      <div className="w-full md:w-auto md:flex-1 flex justify-start md:justify-end mt-2 md:mt-0">
        <SkeletonProgressBar />
      </div>
    </div>
    
    {/* Navigation tabs skeleton */}
    <nav className="flex h-[35px] border-b px-4 md:px-8 bg-white">
      {['Tindakan', 'Pesan'].map((tab) => (
        <div key={tab} className="py-2 md:py-3 px-4 md:px-6 min-w-[100px]">
          <Skeleton height="16px" width="60px" />
        </div>
      ))}
    </nav>
  </header>
);

export const MessageSkeleton: React.FC = () => (
  <div className="h-full flex flex-col">
    {/* Chat messages skeleton */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            index % 2 === 0 ? 'bg-gray-100' : 'bg-green-500'
          }`}>
            <Skeleton lines={Math.floor(Math.random() * 3) + 1} height="14px" />
            <div className="mt-2">
              <Skeleton height="10px" width="60px" />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Message input skeleton */}
    <div className="border-t bg-white p-4">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Skeleton height="40px" width="100%" rounded />
        </div>
        <Skeleton width="40px" height="40px" rounded />
      </div>
    </div>
  </div>
);

export const TindakanSkeleton: React.FC = () => (
  <div className="h-full p-4 space-y-6">
    {/* Step Progress Skeleton */}
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
      <Skeleton height="20px" width="200px" className="mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3">
            <Skeleton circle width="24px" height="24px" />
            <Skeleton height="16px" width="150px" />
          </div>
        ))}
      </div>
    </div>

    {/* Action Form Skeleton */}
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
      <Skeleton height="24px" width="300px" className="mb-4" />
      <div className="space-y-4">
        <div>
          <Skeleton height="16px" width="100px" className="mb-2" />
          <Skeleton height="40px" width="100%" rounded />
        </div>
        <div>
          <Skeleton height="16px" width="120px" className="mb-2" />
          <Skeleton height="100px" width="100%" rounded />
        </div>
        <div className="flex space-x-2">
          <Skeleton width="120px" height="40px" rounded />
          <Skeleton width="100px" height="40px" rounded />
        </div>
      </div>
    </div>

    {/* History/Timeline Skeleton */}
    <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
      <Skeleton height="20px" width="150px" className="mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
            <Skeleton circle width="32px" height="32px" />
            <div className="flex-1 space-y-2">
              <Skeleton height="16px" width="200px" />
              <Skeleton height="14px" width="300px" />
              <Skeleton height="12px" width="100px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const PengaduanPageSkeleton: React.FC = () => (
  <div className="w-full h-full">
    <LaporanListSkeleton />
  </div>
);

export const LaporanDetailSkeleton: React.FC = () => (
  <div className="w-full h-full flex flex-col bg-white overflow-hidden">
    <LaporanDetailHeaderSkeleton />
    
    <main className="flex-1 overflow-hidden relative">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="h-full px-3 py-3">
          <TindakanSkeleton />
        </div>
      </div>
    </main>
    
    {/* Action buttons footer skeleton */}
    <footer className="w-full bg-white border-t z-30 px-4 md:px-8 py-3 flex justify-center shadow-lg">
      <div className="flex space-x-3">
        <Skeleton width="120px" height="40px" rounded />
        <Skeleton width="100px" height="40px" rounded />
      </div>
    </footer>
  </div>
);

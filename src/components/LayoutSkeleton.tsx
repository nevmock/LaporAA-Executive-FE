'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export const TopNavbarSkeleton: React.FC = () => (
  <header className="h-16 bg-white border-b border-gray-200 shadow-sm">
    <div className="h-full flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center space-x-4">
        <Skeleton width="24px" height="24px" className="md:hidden" />
        <Skeleton height="20px" width="150px" />
      </div>
      
      <div className="flex items-center space-x-4">
        <Skeleton circle width="32px" height="32px" />
        <div className="hidden md:flex flex-col space-y-1">
          <Skeleton height="14px" width="80px" />
          <Skeleton height="12px" width="60px" />
        </div>
        <Skeleton width="24px" height="24px" />
      </div>
    </div>
  </header>
);

export const SidebarSkeleton: React.FC = () => (
  <aside className="w-64 bg-gray-900 text-white flex flex-col">
    {/* Logo section */}
    <div className="p-6 border-b border-gray-700">
      <div className="flex items-center space-x-3">
        <Skeleton circle width="40px" height="40px" className="bg-gray-700" />
        <div className="space-y-1">
          <Skeleton height="16px" width="120px" className="bg-gray-700" />
          <Skeleton height="12px" width="80px" className="bg-gray-700" />
        </div>
      </div>
    </div>

    {/* Navigation menu */}
    <nav className="flex-1 p-4">
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 rounded-lg">
            <Skeleton width="20px" height="20px" className="bg-gray-700" />
            <Skeleton height="16px" width="100px" className="bg-gray-700" />
            {index === 1 && (
              <Skeleton circle width="20px" height="20px" className="bg-red-600 ml-auto" />
            )}
          </div>
        ))}
      </div>
    </nav>

    {/* User section */}
    <div className="p-4 border-t border-gray-700">
      <div className="flex items-center space-x-3">
        <Skeleton circle width="32px" height="32px" className="bg-gray-700" />
        <div className="flex-1 space-y-1">
          <Skeleton height="14px" width="80px" className="bg-gray-700" />
          <Skeleton height="12px" width="60px" className="bg-gray-700" />
        </div>
        <Skeleton width="20px" height="20px" className="bg-gray-700" />
      </div>
    </div>
  </aside>
);

export const SidebarHorizontalSkeleton: React.FC = () => (
  <nav className="bg-white border-t border-gray-200 shadow-sm">
    <div className="flex justify-around py-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center p-2 min-w-0">
          <div className="relative">
            <Skeleton width="24px" height="24px" />
            {index === 1 && (
              <Skeleton circle width="16px" height="16px" className="absolute -top-1 -right-1 bg-red-500" />
            )}
          </div>
          <Skeleton height="10px" width="40px" className="mt-1" />
        </div>
      ))}
    </div>
  </nav>
);

export const AppShellSkeleton: React.FC = () => (
  <div className="flex h-screen w-screen flex-col sm:flex-row">
    {/* Desktop Layout */}
    <div className="hidden sm:flex sm:flex-row w-full h-full">
      <SidebarSkeleton />
      <main className="flex-1 bg-gray-900 text-white flex flex-col overflow-hidden">
        <TopNavbarSkeleton />
        <div className="flex-1 overflow-auto bg-white p-6">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
                <Skeleton lines={4} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>

    {/* Mobile Layout */}
    <div className="flex sm:hidden flex-col h-screen overflow-hidden">
      <TopNavbarSkeleton />
      <div className="flex-1 overflow-auto bg-white p-4">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
              <Skeleton lines={3} />
            </div>
          ))}
        </div>
      </div>
      <SidebarHorizontalSkeleton />
    </div>
  </div>
);

export const LoadingPageSkeleton: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white">
    <div className="flex flex-col items-center space-y-4">
      <Skeleton circle width="64px" height="64px" />
      <Skeleton height="20px" width="200px" />
      <Skeleton height="16px" width="150px" />
    </div>
  </div>
);

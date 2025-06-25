'use client';

import React from 'react';
import { Skeleton } from './Skeleton';
import TopNavbar from './TopNavbar';
import Sidebar from './sidebar';
import SidebarHorizontal from './sidebarHorizontal';

// Skeleton untuk main content saja
export const MainContentSkeleton: React.FC = () => (
  <div className="flex-1 overflow-auto bg-white p-6">
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-md p-6">
          <Skeleton lines={4} />
        </div>
      ))}
    </div>
  </div>
);

// Skeleton untuk mobile main content
export const MobileMainContentSkeleton: React.FC = () => (
  <div className="flex-1 overflow-auto bg-white p-4">
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-md p-4">
          <Skeleton lines={3} />
        </div>
      ))}
    </div>
  </div>
);

interface AppShellSkeletonProps {
  title?: string;
  userName?: string;
  role?: string;
  countPending?: number;
  namaAdmin?: string;
  onLogout?: () => void;
}

export const AppShellSkeleton: React.FC<AppShellSkeletonProps> = ({
  title = "Loading...",
  userName = "User",
  role = "Admin",
  countPending = 0,
  namaAdmin = "Administrator",
  onLogout = () => {}
}) => (
  <div className="flex h-screen w-screen flex-col sm:flex-row">
    {/* Desktop Layout */}
    <div className="hidden sm:flex sm:flex-row w-full h-full">
      <Sidebar countPending={countPending} />
      <main className="flex-1 bg-gray-900 text-white flex flex-col overflow-hidden">
        <TopNavbar 
          title={title}
          userName={userName}
          role={role}
          onLogout={onLogout}
          countPending={countPending}
          namaAdmin={namaAdmin}
        />
        <MainContentSkeleton />
      </main>
    </div>

    {/* Mobile Layout */}
    <div className="flex sm:hidden flex-col h-screen overflow-hidden">
      <TopNavbar 
        title={title}
        userName={userName}
        role={role}
        onLogout={onLogout}
        isMobile={true}
        countPending={countPending}
        namaAdmin={namaAdmin}
      />
      <MobileMainContentSkeleton />
      <SidebarHorizontal countPending={countPending} onLogout={onLogout} />
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

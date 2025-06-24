// Export all skeleton components for easy importing
export * from '../Skeleton';
export * from '../LayoutSkeleton';
export * from '../AuthSkeleton';
export * from '../dashboard/DashboardSkeleton';
export * from '../pengaduan/PengaduanSkeleton';

// Default skeleton components for common use cases
export { default as Skeleton } from '../Skeleton';
export { AppShellSkeleton as DefaultAppSkeleton } from '../LayoutSkeleton';
export { DashboardHomeSkeleton as DefaultDashboardSkeleton } from '../dashboard/DashboardSkeleton';
export { LaporanListSkeleton as DefaultListSkeleton } from '../pengaduan/PengaduanSkeleton';
export { LoginFormSkeleton as DefaultLoginSkeleton } from '../AuthSkeleton';

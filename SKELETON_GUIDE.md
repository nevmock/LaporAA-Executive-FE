# Skeleton Loading Components

Komponen skeleton ini dibuat untuk memberikan pengalaman loading yang konsisten di seluruh aplikasi LaporAA. Skeleton membantu mencegah layout shift saat data sedang dimuat.

## Komponen Utama

### 1. Base Skeleton Component (`Skeleton.tsx`)
Komponen dasar yang dapat dikustomisasi untuk berbagai kebutuhan:

```tsx
import { Skeleton } from '@/components/Skeleton';

// Basic skeleton
<Skeleton width="100px" height="20px" />

// Text skeleton with multiple lines
<Skeleton lines={3} variant="text" />

// Circle skeleton (untuk avatar)
<Skeleton circle width="40px" height="40px" />

// Card skeleton
<SkeletonCard />

// Table skeleton
<SkeletonTable rows={5} cols={4} />
```

### 2. Layout Skeletons (`LayoutSkeleton.tsx`)
Skeleton untuk komponen layout utama:

- `AppShellSkeleton` - Skeleton untuk keseluruhan layout aplikasi
- `TopNavbarSkeleton` - Skeleton untuk navigation bar
- `SidebarSkeleton` - Skeleton untuk sidebar desktop
- `SidebarHorizontalSkeleton` - Skeleton untuk navigation mobile

### 3. Dashboard Skeletons (`dashboard/DashboardSkeleton.tsx`)
Skeleton khusus untuk komponen dashboard:

- `DashboardHomeSkeleton` - Skeleton untuk halaman dashboard utama
- `SummaryTableSkeleton` - Skeleton untuk tabel ringkasan
- `SummaryPieChartSkeleton` - Skeleton untuk pie chart
- `LineChartSkeleton` - Skeleton untuk line chart
- `BarOpdChartSkeleton` - Skeleton untuk bar chart OPD
- `MapPersebaranSkeleton` - Skeleton untuk peta persebaran

### 4. Pengaduan Skeletons (`pengaduan/PengaduanSkeleton.tsx`)
Skeleton untuk komponen pengaduan:

- `LaporanListSkeleton` - Skeleton untuk daftar laporan
- `LaporanDetailSkeleton` - Skeleton untuk detail laporan
- `MessageSkeleton` - Skeleton untuk chat messages
- `TindakanSkeleton` - Skeleton untuk form tindakan

### 5. Auth Skeletons (`AuthSkeleton.tsx`)
Skeleton untuk komponen autentikasi:

- `LoginFormSkeleton` - Skeleton untuk form login

## Penggunaan di Dynamic Imports

```tsx
// Penggunaan dengan dynamic import
const MyComponent = dynamic(() => import('./MyComponent'), {
  ssr: false,
  loading: () => <MyComponentSkeleton />
});
```

## Implementasi di Komponen Existing

Skeleton sudah diintegrasikan ke komponen-komponen berikut:

### Dashboard Components
- `Home.tsx` - Menggunakan `DashboardHomeSkeleton` saat loading
- `SummaryTable.tsx` - Menggunakan `SummaryTableSkeleton` saat fetching data
- `SummaryPieChart.tsx` - Menggunakan `SummaryPieChartSkeleton` saat loading
- `LineChart.tsx` - Menggunakan `LineChartSkeleton` saat loading

### Pengaduan Components
- `Pengaduan.tsx` - Menggunakan `PengaduanPageSkeleton` saat loading
- `laporan.tsx` - Menggunakan `LaporanListSkeleton` saat loading
- `Laporan.tsx` (detail) - Menggunakan `LaporanDetailSkeleton` saat loading

### Layout Components
- `AppShell.tsx` - Menggunakan `AppShellSkeleton` saat initial load
- `LoadingPage.tsx` - Menggunakan `LoadingPageSkeleton` sebagai default

## Customization

Setiap skeleton component dapat dikustomisasi dengan props:

```tsx
<Skeleton 
  className="custom-class"
  width="200px"
  height="30px"
  rounded={true}
  lines={2}
/>
```

## Best Practices

1. **Konsistensi**: Gunakan skeleton yang sesuai dengan ukuran dan layout komponen asli
2. **Timing**: Tampilkan skeleton segera saat mulai loading, hilangkan setelah data dimuat
3. **Responsif**: Pastikan skeleton responsive seperti komponen aslinya
4. **Accessibility**: Skeleton sudah include `sr-only` untuk screen readers

## Animation

Semua skeleton menggunakan `animate-pulse` dari Tailwind CSS untuk efek loading yang smooth.

## File Structure

```
src/components/
├── Skeleton.tsx              # Base skeleton components
├── LayoutSkeleton.tsx        # Layout skeleton components  
├── AuthSkeleton.tsx          # Auth skeleton components
├── dashboard/
│   └── DashboardSkeleton.tsx # Dashboard skeleton components
├── pengaduan/
│   └── PengaduanSkeleton.tsx # Pengaduan skeleton components
└── skeletons/
    └── index.ts              # Export index file
```

# Admin Performance Dashboard Implementation

## Overview
Implementasi frontend untuk admin performance monitoring system yang terintegrasi dengan halaman User Management sebagai tab terpisah.

## Files Created

### 1. Services
- **`src/services/adminPerformanceService.ts`**
  - Service untuk API calls ke backend admin performance
  - Includes TypeScript interfaces untuk semua response types
  - Methods: getDashboard, getAdminDetail, getOnlineStatus, getMonthlyReport

### 2. Components
- **`src/components/dashboard/AdminPerformance.tsx`**
  - Main dashboard component untuk overview performa semua admin
  - Features: Summary cards, admin performance table, recent activities
  - Date range filtering dan real-time refresh

- **`src/components/dashboard/AdminDetailView.tsx`**
  - Detail view untuk performa admin tertentu
  - Features: Individual admin stats, activity timeline, session history, processed reports
  - Date range filtering

- **`src/components/dashboard/OnlineStatusWidget.tsx`**
  - Widget untuk menampilkan status online admin real-time
  - Auto refresh setiap 30 detik
  - Click handler untuk navigasi ke detail admin

### 3. Updated Pages
- **`src/app/(dashboard)/user-management/page.tsx`**
  - Updated dengan tab system
  - Tab 1: User Management (existing functionality)
  - Tab 2: Admin Performance (new functionality)
  - Integration dengan performance components

## Features Implemented

### Tab System
- User Management tab untuk CRUD operations user
- Admin Performance tab untuk monitoring performa
- Smooth tab switching dengan state management

### Admin Performance Dashboard
- **Summary Cards**: Total admins, online admins, reports processed, total activities
- **Performance Table**: Overview semua admin dengan metrics
  - Admin info dengan avatar
  - Online/offline status indicators
  - Activity counts dan session duration
  - Last activity timestamp
- **Recent Activities**: Timeline aktivitas terbaru
- **Date Range Filtering**: Filter data berdasarkan periode
- **Real-time Refresh**: Manual refresh button

### Admin Detail View
- **Individual Metrics**: Total activities, sessions, reports processed, avg session duration
- **Activity Timeline**: List semua aktivitas dengan timestamps dan descriptions
- **Session History**: Login/logout sessions dengan duration
- **Processed Reports**: Table laporan yang sudah diproses
- **Back Navigation**: Return ke dashboard overview

### Performance Button Integration
- Tombol "View Performance" di setiap baris admin di user management
- Otomatis switch ke performance tab dan show detail
- Hanya muncul untuk role Admin dan SuperAdmin

## Usage

### Accessing Performance Dashboard
1. Navigate to User Management page
2. Click "Admin Performance" tab
3. View overview dashboard atau click admin untuk detail

### Viewing Individual Admin Performance
1. **Method 1**: From User Management tab
   - Click performance icon (activity icon) di baris admin
   - Otomatis switch ke performance tab dan show detail

2. **Method 2**: From Performance Dashboard
   - Browse admin performance table
   - Click row untuk view detail (jika implemented)

### Filtering Data
- Use date range picker di header untuk filter data
- Default: 30 hari terakhir
- Apply filter akan refresh semua components

## API Integration

### Backend Endpoints Used
- `GET /performance/dashboard` - Dashboard overview data
- `GET /performance/admin/:adminId` - Individual admin details
- `GET /performance/status` - Real-time online status
- `GET /performance/monthly` - Monthly reports (ready for future use)

### Authentication
- Semua API calls menggunakan existing axiosInstance
- Automatic token handling dari localStorage
- Error handling untuk expired tokens

## State Management

### User Management State
- `activeTab`: Current active tab ('users' | 'performance')
- `selectedAdminId`: ID admin yang dipilih untuk detail view
- `showAdminDetail`: Flag untuk show/hide detail view

### Performance State
- Date range untuk filtering
- Loading states untuk API calls
- Refresh states untuk manual updates

## Responsive Design
- Mobile-friendly layout
- Responsive tables dengan horizontal scroll
- Collapsible sections untuk small screens
- Touch-friendly buttons dan interactions

## Security & Access Control
- Hanya SuperAdmin yang bisa akses User Management
- Performance monitoring available sesuai role permissions
- Data filtering berdasarkan user permissions (if implemented in backend)

## Future Enhancements
- Export performance reports ke PDF/Excel
- Email notifications untuk performance alerts
- Advanced filtering options (by role, department, etc.)
- Performance charts dan visualizations
- Real-time notifications untuk admin activities

## Testing
1. **User Management Tab**
   - CRUD operations masih berfungsi normal
   - Tab switching works properly

2. **Performance Tab**
   - Dashboard loads dengan data yang benar
   - Date filtering works
   - Admin detail navigation works
   - Back button dari detail works

3. **Integration**
   - Performance button di user table works
   - State management between tabs works
   - No conflicts dengan existing functionality

## Dependencies
- React Icons (FiActivity, FiUsers, dll.)
- Existing useAuth hook
- Existing axiosInstance utility
- Tailwind CSS untuk styling

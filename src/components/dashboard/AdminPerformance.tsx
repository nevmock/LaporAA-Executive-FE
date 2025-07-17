"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  FiActivity,
  FiUsers,
  FiFileText,
  FiTrendingUp,
  FiCalendar,
  FiEye,
  FiRefreshCw,
  FiBarChart,
  FiPieChart,
  FiInfo,
  FiDownload,
  FiX
} from 'react-icons/fi';
import { adminPerformanceService, AdminPerformanceDashboard } from '@/services/adminPerformanceService';

// Type definitions for better type safety
interface StatusModalState {
  isOpen: boolean;
  status: string;
  adminName: string;
  reports: ReportDetails[];
}

interface ReportDetails {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  sessionId?: string;
  message?: string;
  location?: {
    kecamatan?: string;
    desa?: string;
    description?: string;
  } | string;
  priority?: string;
  opd?: string[];
}

interface DownloadDataObject {
  [key: string]: string | number | string[] | object | undefined;
}

interface TrendDataPoint {
  adminName: string;
  [status: string]: string | number;
}

// Warna status sesuai dengan warna marker di map dan dashboard
const STATUS_COLORS: Record<string, string> = {
  'Perlu Verifikasi': '#ef4444',        // red
  'Verifikasi Situasi': '#a855f7',      // violet
  'Verifikasi Kelengkapan Berkas': '#f97316', // orange
  'Proses OPD Terkait': '#eab308',      // yellow
  'Selesai Penanganan': '#3b82f6',      // blue
  'Selesai Pengaduan': '#22c55e',       // green
  'Ditutup': '#374151',                 // black/gray
};

interface AdminPerformanceProps {
  selectedAdminId?: string;
}

const AdminPerformance: React.FC<AdminPerformanceProps> = ({ selectedAdminId }) => {
  const [dashboardData, setDashboardData] = useState<AdminPerformanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [showAllAdmins, setShowAllAdmins] = useState(false);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });
  const [statusModal, setStatusModal] = useState<StatusModalState>({
    isOpen: false,
    status: '',
    adminName: '',
    reports: []
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminPerformanceService.getDashboard({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        adminId: selectedAdminId
      });
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate, selectedAdminId]);

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Note: formatDuration function removed as it was unused

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Info modal functionality
  const showInfo = (title: string, content: string) => {
    setInfoModal({ isOpen: true, title, content });
  };

  const closeInfo = () => {
    setInfoModal({ isOpen: false, title: '', content: '' });
  };

  // Status modal functionality
  const showStatusReports = async (status: string, adminName: string, adminId: string) => {
    try {
      console.log('Fetching reports for:', { status, adminName, adminId, dateRange });

      // Fetch reports for this specific status and admin
      const reports = await adminPerformanceService.getReportsByStatus({
        adminId,
        status,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      console.log('Received reports:', reports);

      setStatusModal({
        isOpen: true,
        status,
        adminName,
        reports: reports || []
      });
    } catch (error) {
      console.error('Error fetching status reports:', error);
      alert(`Error loading reports: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusModal({
        isOpen: true,
        status,
        adminName,
        reports: []
      });
    }
  };

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false, status: '', adminName: '', reports: [] });
  };

  // Download functionality
  const downloadData = (data: DownloadDataObject[] | DownloadDataObject, filename: string, type: 'csv' | 'json' = 'csv') => {
    let content = '';
    let mimeType = '';

    if (type === 'csv') {
      if (Array.isArray(data)) {
        if (data.length > 0) {
          const headers = Object.keys(data[0]).join(',');
          const rows = data.map(item => Object.values(item).join(',')).join('\n');
          content = headers + '\n' + rows;
        }
      } else if (typeof data === 'object') {
        const headers = Object.keys(data).join(',');
        const values = Object.values(data).join(',');
        content = headers + '\n' + values;
      }
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Info content definitions
  const infoContent = {
    totalAdmins: "Total number of active administrators in the system. This includes all users with administrative privileges.",
    totalReports: "Total number of reports submitted within the selected date range. This includes all report types and statuses.",
    avgResponseTime: "Average time taken by administrators to respond to reports. Calculated as the mean of all response times for processed reports.",
    totalActiveSessions: "Number of currently active administrator sessions. An active session is one where the admin has interacted with the system within the last 30 minutes.",
    responseTimeChart: "Visual representation of average response times per administrator. Shows how quickly each admin typically responds to reports. Lower values indicate faster response times.",
    reportStatusChart: "Distribution of report statuses across all submitted reports. Shows the breakdown of pending, in-progress, completed, and rejected reports.",
    adminActivityChart: "Comparison of activity levels among administrators. Shows metrics like reports handled, average response time, and session duration for each admin.",
    trendAnalysisChart: "Time-series analysis showing trends in report submissions and response times over the selected period. Helps identify patterns and peak activity periods.",
    performanceRadarChart: "Multi-dimensional performance analysis showing various metrics (response time, reports handled, accuracy, etc.) for selected administrators on a radar chart.",
    efficiencyGaugeChart: "Overall efficiency score for the administrative team. Calculated based on response times, resolution rates, and other performance indicators. Scale: 0-100%"
  };

  // Note: prepareDownloadData function removed as it was unused
  // Note: calculateAverageResponseTime function removed as it was unused

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No performance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Admin Performance Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor admin activities and performance metrics</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'overview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'detailed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Detailed
            </button>
          </div>

          {/* Date Range Picker */}
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" size={16} />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
            />
            <span className="text-gray-500 font-medium">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={16} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FiFileText className="text-orange-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reports Processed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => showInfo('Reports Processed', 'Total number of reports that have been processed by all administrators within the selected date range. This includes all report statuses and types.')}
                className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                title="Info"
              >
                <FiInfo size={16} />
              </button>
              <button
                onClick={() => downloadData({
                  totalReportsProcessed: dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0),
                  reportsByAdmin: dashboardData.reportStats.map(stat => ({ adminName: stat.adminName, processed: stat.totalProcessed }))
                }, 'reports-processed')}
                className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                title="Download"
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total reports handled by all administrators</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiTrendingUp className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Per Admin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.reportStats.length > 0
                    ? Math.round(dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0) / dashboardData.reportStats.length)
                    : 0
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => showInfo('Average Per Admin', 'Average number of reports processed per administrator. Calculated as total reports processed divided by the total number of administrators. This metric helps assess workload distribution.')}
                className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                title="Info"
              >
                <FiInfo size={16} />
              </button>
              <button
                onClick={() => downloadData({
                  averagePerAdmin: dashboardData.reportStats.length > 0
                    ? Math.round(dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0) / dashboardData.reportStats.length)
                    : 0,
                  totalAdmins: dashboardData.reportStats.length,
                  totalReports: dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0)
                }, 'average-per-admin')}
                className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                title="Download"
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Average workload distribution per administrator</p>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiTrendingUp className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => showInfo('Performance Summary', 'Key performance indicators showing top performer, average performance, and most common report status. These metrics provide insights into team efficiency and workload patterns.')}
              className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
              title="Summary Information"
            >
              <FiInfo size={16} />
            </button>
            <button
              onClick={() => {
                const topPerformer = dashboardData.reportStats.length > 0
                  ? dashboardData.reportStats.reduce((top, admin) =>
                    admin.totalProcessed > top.totalProcessed ? admin : top
                  )
                  : null;
                const avgPerAdmin = dashboardData.reportStats.length > 0
                  ? Math.round(dashboardData.reportStats.reduce((sum, admin) => sum + admin.totalProcessed, 0) / dashboardData.reportStats.length)
                  : 0;
                const statusMap: { [key: string]: number } = {};
                dashboardData.reportStats.forEach(admin => {
                  admin.statusBreakdown.forEach(status => {
                    statusMap[status.status] = (statusMap[status.status] || 0) + status.count;
                  });
                });
                const mostCommonStatus = Object.entries(statusMap).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);

                downloadData({
                  topPerformer: {
                    name: topPerformer?.adminName || 'N/A',
                    reportsProcessed: topPerformer?.totalProcessed || 0
                  },
                  averagePerAdmin: avgPerAdmin,
                  mostCommonStatus: {
                    status: mostCommonStatus[0],
                    count: mostCommonStatus[1]
                  }
                }, 'performance-summary');
              }}
              className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
              title="Download Summary Data"
            >
              <FiDownload size={16} />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-6">Key performance metrics and team overview</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Top Performer (Admin only) */}
          <div className="group relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50 opacity-60"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Top Performer</p>
                  <h3 className="text-xl font-bold text-gray-800 leading-tight">
                    {(() => {
                      const admins = dashboardData.reportStats.filter(a => a.role === 'Admin');
                      if (admins.length === 0) return 'N/A';
                      const top = admins.reduce((top, admin) => admin.totalProcessed > top.totalProcessed ? admin : top);
                      return top.adminName || 'N/A';
                    })()}
                  </h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-800">
                    {(() => {
                      const admins = dashboardData.reportStats.filter(a => a.role === 'Admin');
                      if (admins.length === 0) return 0;
                      const top = admins.reduce((top, admin) => admin.totalProcessed > top.totalProcessed ? admin : top);
                      return top.totalProcessed;
                    })()}
                  </span>
                  <span className="text-sm font-medium text-gray-700">reports</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Worst Performer (Admin only) */}
          <div className="group relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-50 opacity-60"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.33L10.5 11L15.5 16H6V18H20V16H17.5L21 9Z" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Needs Improvement</p>
                  <h3 className="text-xl font-bold text-gray-800 leading-tight">
                    {(() => {
                      const admins = dashboardData.reportStats.filter(a => a.role === 'Admin');
                      if (admins.length === 0) return 'N/A';
                      const worst = admins.reduce((worst, admin) => admin.totalProcessed < worst.totalProcessed ? admin : worst);
                      return worst.adminName || 'N/A';
                    })()}
                  </h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-red-700">
                    {(() => {
                      const admins = dashboardData.reportStats.filter(a => a.role === 'Admin');
                      if (admins.length === 0) return 0;
                      const worst = admins.reduce((worst, admin) => admin.totalProcessed < worst.totalProcessed ? admin : worst);
                      return worst.totalProcessed;
                    })()}
                  </span>
                  <span className="text-sm font-medium text-gray-700">reports</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-900 rounded-full">Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Performance (Admin only) */}
          <div className="group relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 opacity-60"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Team Average</p>
                  <h3 className="text-xl font-bold text-gray-800 leading-tight">Admin Performance</h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-800">
                    {(() => {
                      const admins = dashboardData.reportStats.filter(a => a.role === 'Admin');
                      return admins.length > 0 ? Math.round(admins.reduce((sum, admin) => sum + admin.totalProcessed, 0) / admins.length) : 0;
                    })()}
                  </span>
                  <span className="text-sm font-medium text-gray-700">avg reports</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-900 rounded-full">Admin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Most Common Status (all roles) */}
          <div className="group relative overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-white to-yellow-100 opacity-60"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M7,13H17V11H7" />
                  </svg>
                </div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1">Most Common</p>
                  <h3 className="text-lg font-bold text-gray-800 leading-tight">
                    {(() => {
                      const statusMap: { [key: string]: number } = {};
                      dashboardData.reportStats.forEach(admin => {
                        admin.statusBreakdown.forEach(status => {
                          statusMap[status.status] = (statusMap[status.status] || 0) + status.count;
                        });
                      });
                      const topStatus = Object.entries(statusMap).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
                      return topStatus[0] || 'N/A';
                    })()}
                  </h3>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-yellow-800">
                    {(() => {
                      const statusMap: { [key: string]: number } = {};
                      dashboardData.reportStats.forEach(admin => {
                        admin.statusBreakdown.forEach(status => {
                          statusMap[status.status] = (statusMap[status.status] || 0) + status.count;
                        });
                      });
                      const topStatus = Object.entries(statusMap).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
                      return topStatus[1] || 0;
                    })()}
                  </span>
                  <span className="text-sm font-medium text-gray-700">cases</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-900 rounded-full">Status</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Charts Section - Overview */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Admin Performance Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiBarChart className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Admin Performance Comparison</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showInfo('Admin Performance Comparison', 'Bar chart showing the number of reports processed by each administrator. This helps compare individual performance and workload distribution across the team.')}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Chart Information"
                >
                  <FiInfo size={16} />
                </button>
                <button
                  onClick={() => downloadData(
                    dashboardData.reportStats.map(stat => ({
                      adminName: stat.adminName,
                      reportsProcessed: stat.totalProcessed,
                      role: stat.role
                    })),
                    'admin-performance-comparison'
                  )}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Download Chart Data"
                >
                  <FiDownload size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">Compare individual administrator performance by reports processed</p>

            <ReactECharts
              option={{
                tooltip: {
                  trigger: 'axis',
                  axisPointer: {
                    type: 'shadow'
                  }
                },
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '3%',
                  containLabel: true
                },
                xAxis: {
                  type: 'category',
                  data: dashboardData.reportStats.map(stat => stat.adminName || 'Unknown'),
                  axisLabel: {
                    interval: 0,
                    rotate: 45,
                    fontSize: 12
                  }
                },
                yAxis: {
                  type: 'value',
                  name: 'Number of Reports'
                },
                series: [{
                  name: 'Reports Processed',
                  type: 'bar',
                  data: dashboardData.reportStats.map(stat => ({
                    value: stat.totalProcessed,
                    itemStyle: {
                      color: '#3B82F6'
                    }
                  })),
                  barWidth: '60%',
                  itemStyle: {
                    borderRadius: [4, 4, 0, 0]
                  }
                }]
              }}
              style={{ height: '300px' }}
            />
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiPieChart className="text-green-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">Overall Status Distribution</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showInfo('Overall Status Distribution', 'Pie chart showing the distribution of report statuses across all processed reports. This helps understand the current state of reports and processing patterns.')}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Chart Information"
                >
                  <FiInfo size={16} />
                </button>
                <button
                  onClick={() => {
                    const statusMap: { [key: string]: number } = {};
                    dashboardData.reportStats.forEach(admin => {
                      admin.statusBreakdown.forEach(status => {
                        statusMap[status.status] = (statusMap[status.status] || 0) + status.count;
                      });
                    });
                    downloadData(
                      Object.entries(statusMap).map(([status, count]) => ({ status, count })),
                      'status-distribution'
                    );
                  }}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Download Chart Data"
                >
                  <FiDownload size={16} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">Distribution of all report statuses across the system</p>

            <ReactECharts
              option={(() => {
                // Calculate overall status distribution
                const statusMap: { [key: string]: number } = {};
                dashboardData.reportStats.forEach(admin => {
                  admin.statusBreakdown.forEach(status => {
                    statusMap[status.status] = (statusMap[status.status] || 0) + status.count;
                  });
                });

                const statusData = Object.entries(statusMap).map(([name, value]) => ({
                  name,
                  value,
                  itemStyle: {
                    color: STATUS_COLORS[name] || '#6b7280'
                  }
                }));

                return {
                  tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)'
                  },
                  legend: {
                    bottom: '0%',
                    left: 'center'
                  },
                  series: [{
                    name: 'Status',
                    type: 'pie',
                    radius: '70%',
                    center: ['50%', '40%'],
                    data: statusData,
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                    },
                    color: statusData.map(item => item.itemStyle.color)
                  }]
                };
              })()}
              style={{ height: '300px' }}
            />
          </div>
        </div>
      )}

      {/* Trend Analysis - Overview Mode */}
      {viewMode === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiTrendingUp className="text-indigo-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Status Trend Analysis</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showInfo('Status Trend Analysis', 'Area chart showing the trend of different report statuses across administrators. This helps identify patterns in report processing and status changes over time.')}
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Chart Information"
              >
                <FiInfo size={16} />
              </button>
              <button
                onClick={() => {
                  const statusCategories = ['Ditutup', 'Selesai Penanganan', 'Proses OPD Terkait', 'Perlu Verifikasi', 'Selesai Pengaduan'];
                  const adminNames = dashboardData.reportStats.map(admin => admin.adminName || 'Unknown');
                  const trendData: TrendDataPoint[] = adminNames.slice(0, 5).map(adminName => {
                    const admin = dashboardData.reportStats.find(a => a.adminName === adminName);
                    const data: TrendDataPoint = { adminName };
                    statusCategories.forEach(status => {
                      const statusData = admin?.statusBreakdown.find(s => s.status === status);
                      data[status] = statusData ? statusData.count : 0;
                    });
                    return data;
                  });
                  downloadData(trendData, 'status-trend-analysis');
                }}
                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Download Chart Data"
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">Trend analysis of report statuses across different administrators</p>

          <ReactECharts
            option={(() => {
              // Create mock trend data based on status breakdown
              const statusCategories = ['Ditutup', 'Selesai Penanganan', 'Proses OPD Terkait', 'Perlu Verifikasi', 'Selesai Pengaduan'];
              const adminNames = dashboardData.reportStats.map(admin => admin.adminName || 'Unknown');

              return {
                tooltip: {
                  trigger: 'axis'
                },
                legend: {
                  data: statusCategories
                },
                grid: {
                  left: '3%',
                  right: '4%',
                  bottom: '3%',
                  containLabel: true
                },
                toolbox: {
                  feature: {
                    saveAsImage: {}
                  }
                },
                xAxis: {
                  type: 'category',
                  boundaryGap: false,
                  data: adminNames.slice(0, 5)
                },
                yAxis: {
                  type: 'value'
                },
                series: statusCategories.map((status) => ({
                  name: status,
                  type: 'line',
                  stack: 'Total',
                  areaStyle: {},
                  emphasis: {
                    focus: 'series'
                  },
                  data: adminNames.slice(0, 5).map(adminName => {
                    const admin = dashboardData.reportStats.find(a => a.adminName === adminName);
                    const statusData = admin?.statusBreakdown.find(s => s.status === status);
                    return statusData ? statusData.count : 0;
                  }),
                  color: STATUS_COLORS[status] || '#6b7280'
                }))
              };
            })()}
            style={{ height: '400px' }}
          />
        </div>
      )}

      {/* Detailed Summary Section - Detailed View */}
      {viewMode === 'detailed' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Summary</h3>
              <button
                onClick={() => showInfo('Detailed Summary', 'Comprehensive summary metrics providing detailed insights into system performance, including total reports processed, active administrators, and workload distribution for the selected date range.')}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Summary Information"
              >
                <FiInfo size={16} />
              </button>
              <button
                onClick={() => downloadData({
                  totalProcessedReports: dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0),
                  totalActiveAdmins: dashboardData.reportStats.filter(stat => stat.totalProcessed > 0).length,
                  avgReportsPerAdmin: dashboardData.reportStats.length > 0
                    ? Math.round(dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0) / dashboardData.reportStats.length)
                    : 0,
                  totalAdmins: dashboardData.reportStats.length,
                  dateRange: `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
                }, 'detailed-summary')}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Download Summary"
              >
                <FiDownload size={16} />
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Processed Reports */}
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
              <div className="text-xs font-semibold text-blue-600 uppercase">Total Processed Reports</div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0)}
              </div>
            </div>

            {/* Total Active Admins */}
            <div className="bg-green-50 p-4 rounded-lg shadow-sm">
              <div className="text-xs font-semibold text-green-600 uppercase">Total Active Admins</div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.reportStats.filter(stat => stat.totalProcessed > 0).length}
              </div>
            </div>

            {/* Avg Reports Per Admin */}
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
              <div className="text-xs font-semibold text-purple-600 uppercase">Avg Reports Per Admin</div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.reportStats.length > 0
                  ? Math.round(dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0) / dashboardData.reportStats.length)
                  : 0
                }
              </div>
            </div>

            {/* Total Admins */}
            <div className="bg-orange-50 p-4 rounded-lg shadow-sm">
              <div className="text-xs font-semibold text-orange-600 uppercase">Total Admins</div>
              <div className="text-2xl font-bold text-gray-900">{dashboardData.reportStats.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Admin Performance</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showInfo('Detailed Admin Performance', 'Comprehensive table showing detailed performance metrics for each administrator including reports processed, status breakdown, and individual performance percentages.')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Table Information"
              >
                <FiInfo size={16} />
              </button>
              <button
                onClick={() => {
                  const tableData = dashboardData.reportStats.map(admin => {
                    const totalReports = dashboardData.reportStats.reduce((sum, a) => sum + a.totalProcessed, 0);
                    const percentage = totalReports > 0 ? Math.round((admin.totalProcessed / totalReports) * 100) : 0;
                    return {
                      adminName: admin.adminName,
                      adminId: admin.adminId,
                      role: admin.role,
                      totalProcessed: admin.totalProcessed,
                      percentageOfTotal: percentage,
                      statusBreakdown: admin.statusBreakdown.map(s => `${s.status}: ${s.count}`).join('; ')
                    };
                  });
                  downloadData(tableData, 'detailed-admin-performance');
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Download Table Data"
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">Complete performance breakdown for each administrator</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Processed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Breakdown
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.reportStats.map((admin) => {
                const totalReports = dashboardData.reportStats.reduce((sum, a) => sum + a.totalProcessed, 0);
                const percentage = totalReports > 0 ? Math.round((admin.totalProcessed / totalReports) * 100) : 0;

                return (
                  <tr key={admin.adminId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold text-sm">
                              {(admin.adminName || 'Unknown').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{admin.adminName || 'Unknown Admin'}</div>
                          <div className="text-sm text-gray-500">{admin.username || 'No username'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.role === 'SuperAdmin'
                        ? 'bg-purple-100 text-purple-800'
                        : admin.role === 'Bupati'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{admin.totalProcessed}</div>
                      <div className="text-xs text-gray-500">{percentage}% of total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {admin.statusBreakdown.map((status, idx) => (
                          <button
                            key={idx}
                            onClick={() => showStatusReports(status.status, admin.adminName || 'Unknown', admin.adminId)}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer"
                            style={{
                              backgroundColor: `${STATUS_COLORS[status.status] || '#6b7280'}20`,
                              color: STATUS_COLORS[status.status] || '#6b7280',
                              border: `1px solid ${STATUS_COLORS[status.status] || '#6b7280'}40`
                            }}
                            title={`Klik untuk melihat detail laporan ${status.status}`}
                          >
                            {status.status}: {status.count}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-grow">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-2 text-sm font-medium text-gray-900">{percentage}%</div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Individual Admin Charts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FiUsers className="text-purple-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">
              {showAllAdmins ? 'All Admin Performance' : 'Top 4 Admin Performance'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {showAllAdmins ? 'Showing all admins' : 'Showing top 4 performers'}
            </span>
            <button
              onClick={() => setShowAllAdmins(!showAllAdmins)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showAllAdmins
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {showAllAdmins ? 'Show Top 4' : 'Show All'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(showAllAdmins ? dashboardData.reportStats : dashboardData.reportStats.slice(0, 4)).map((admin) => (
            <div key={admin.adminId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {(admin.adminName || 'Unknown').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{admin.adminName || 'Unknown Admin'}</h4>
                    <p className="text-xs text-gray-500">{admin.role} - {admin.totalProcessed} reports</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => showInfo(`${admin.adminName} Performance`, `Individual performance breakdown for ${admin.adminName}. This donut chart shows the distribution of report statuses handled by this administrator, providing insights into their work patterns and specializations.`)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Admin Chart Information"
                  >
                    <FiInfo size={14} />
                  </button>
                  <button
                    onClick={() => downloadData({
                      adminName: admin.adminName,
                      role: admin.role,
                      totalProcessed: admin.totalProcessed,
                      statusBreakdown: admin.statusBreakdown
                    }, `admin-${admin.adminName?.replace(/\s+/g, '-').toLowerCase()}-performance`)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Download Admin Data"
                  >
                    <FiDownload size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-4">Status distribution for {admin.adminName}</p>

              <ReactECharts
                option={{
                  tooltip: {
                    trigger: 'item',
                    formatter: '{a} <br/>{b}: {c} ({d}%)'
                  },
                  series: [{
                    name: 'Status',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['50%', '50%'],
                    data: admin.statusBreakdown.map(s => ({
                      value: s.count,
                      name: s.status,
                      itemStyle: {
                        color: STATUS_COLORS[s.status] || '#6b7280'
                      }
                    })),
                    emphasis: {
                      itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                      }
                    },
                    label: {
                      show: true,
                      formatter: '{d}%'
                    }
                  }]
                }}
                style={{ height: '200px' }}
              />

              <div className="mt-4 space-y-2">
                {admin.statusBreakdown.map((status, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status.status] || '#6b7280' }}
                      ></div>
                      <span className="text-gray-600">{status.status}</span>
                    </div>
                    <span className="font-medium text-gray-900">{status.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Modal */}
      {infoModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{infoModal.title}</h3>
              <button
                onClick={closeInfo}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <p className="text-gray-600 leading-relaxed">{infoModal.content}</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeInfo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Reports Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Laporan {statusModal.status}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Admin: {statusModal.adminName} | Total: {statusModal.reports.length} laporan
                </p>
              </div>
              <button
                onClick={closeStatusModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
              {statusModal.reports.length > 0 ? (
                <div className="space-y-4">
                  {statusModal.reports.map((report, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            #{report.sessionId || `Report-${idx + 1}`}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {report.message ?
                              (report.message.length > 100 ?
                                `${report.message.substring(0, 100)}...` :
                                report.message
                              ) :
                              'No message available'
                            }
                          </p>
                        </div>
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${STATUS_COLORS[statusModal.status] || '#6b7280'}20`,
                            color: STATUS_COLORS[statusModal.status] || '#6b7280'
                          }}
                        >
                          {statusModal.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        {report.createdAt && (
                          <div>Dibuat: {formatDateTime(report.createdAt)}</div>
                        )}
                        {report.opd && Array.isArray(report.opd) && report.opd.length > 0 && (
                          <div>OPD: {report.opd.join(', ')}</div>
                        )}
                        {typeof report.location === 'object' && report.location?.kecamatan && (
                          <div>Kecamatan: {report.location.kecamatan}</div>
                        )}
                        {typeof report.location === 'object' && report.location?.desa && (
                          <div>Desa: {report.location.desa}</div>
                        )}
                        {typeof report.location === 'object' && report.location?.description && (
                          <div>Lokasi: {report.location.description}</div>
                        )}
                        {typeof report.location === 'string' && (
                          <div>Lokasi: {report.location}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiFileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada laporan
                  </h3>
                  <p className="text-gray-600">
                    Tidak ada laporan dengan status &quot;{statusModal.status}&quot; untuk admin {statusModal.adminName} pada periode ini.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={closeStatusModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPerformance;

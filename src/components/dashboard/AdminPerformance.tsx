"use client";

import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  FiActivity, 
  FiUsers, 
  FiFileText, 
  FiClock, 
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
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });

  const loadDashboardData = async () => {
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
  };

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
  }, [dateRange, selectedAdminId]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

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

  // Download functionality
  const downloadData = (data: any, filename: string, type: 'csv' | 'json' = 'csv') => {
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

  // Data preparation for downloads
  const prepareDownloadData = (chartType: string) => {
    if (!dashboardData) return null;

    switch (chartType) {
      case 'summary':
        return {
          totalAdmins: dashboardData.adminStats.length,
          totalReports: dashboardData.reportStats.reduce((total, stat) => total + stat.totalProcessed, 0),
          avgResponseTime: calculateAverageResponseTime(),
          totalActiveSessions: dashboardData.onlineStats.length,
          dateRange: `${dateRange.startDate} to ${dateRange.endDate}`
        };
      case 'responseTime':
        return dashboardData.reportStats.map(stat => ({
          adminName: stat.adminName,
          totalProcessed: stat.totalProcessed,
          role: stat.role
        }));
      case 'reportStatus':
        const statusCounts: { [key: string]: number } = {};
        dashboardData.reportStats.forEach(stat => {
          stat.statusBreakdown.forEach(breakdown => {
            statusCounts[breakdown.status] = (statusCounts[breakdown.status] || 0) + breakdown.count;
          });
        });
        return Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count
        }));
      case 'adminActivity':
        return dashboardData.adminStats.map(admin => ({
          adminName: admin.adminName,
          totalActivities: admin.totalActivities,
          reportActivities: admin.reportActivities,
          lastActivity: admin.lastActivity
        }));
      case 'trendAnalysis':
        return dashboardData.activityStats.map(activity => ({
          date: activity.date,
          adminName: activity.adminName,
          totalActivities: activity.totalActivities
        }));
      default:
        return dashboardData;
    }
  };

  const calculateAverageResponseTime = () => {
    // This would need to be calculated based on available data
    // For now, return a placeholder
    return 45; // minutes
  };

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
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'detailed'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiUsers className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Admins</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.reportStats.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => showInfo('Total Admins', infoContent.totalAdmins)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Info"
              >
                <FiInfo size={16} />
              </button>
              <button
                onClick={() => downloadData({ totalAdmins: dashboardData.reportStats.length }, 'total-admins')}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Download"
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total number of administrators in the system</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FiActivity className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Admins</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.reportStats.filter(stat => stat.totalProcessed > 0).length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => showInfo('Active Admins', 'Number of administrators who have processed at least one report in the selected date range. An active admin is one who has handled reports and contributed to the system.')}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="Info"
              >
                <FiInfo size={16} />
              </button>
              <button
                onClick={() => downloadData({ 
                  activeAdmins: dashboardData.reportStats.filter(stat => stat.totalProcessed > 0).length,
                  activeAdminsList: dashboardData.reportStats.filter(stat => stat.totalProcessed > 0).map(s => s.adminName)
                }, 'active-admins')}
                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                title="Download"
              >
                <FiDownload size={16} />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Admins who have processed at least one report</p>
        </div>

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

      {/* View Mode Toggle */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setViewMode('overview')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            viewMode === 'overview' 
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <FiEye className="w-5 h-5" />
          Overview
        </button>
        <button
          onClick={() => setViewMode('detailed')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            viewMode === 'detailed' 
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          <FiFileText className="w-5 h-5" />
          Detailed View
        </button>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Performer */}
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {dashboardData.reportStats.length > 0 
                ? dashboardData.reportStats.reduce((top, admin) => 
                    admin.totalProcessed > top.totalProcessed ? admin : top
                  ).adminName || 'N/A'
                : 'N/A'
              }
            </div>
            <div className="text-sm text-gray-600">Top Performer</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {dashboardData.reportStats.length > 0 
                ? Math.max(...dashboardData.reportStats.map(s => s.totalProcessed))
                : 0
              } reports
            </div>
          </div>
          
          {/* Average Performance */}
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {dashboardData.reportStats.length > 0 
                ? Math.round(dashboardData.reportStats.reduce((sum, admin) => sum + admin.totalProcessed, 0) / dashboardData.reportStats.length)
                : 0
              }
            </div>
            <div className="text-sm text-gray-600">Average per Admin</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">reports processed</div>
          </div>
          
          {/* Most Common Status */}
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
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
            </div>
            <div className="text-sm text-gray-600">Most Common Status</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">
              {(() => {
                const statusMap: { [key: string]: number } = {};
                dashboardData.reportStats.forEach(admin => {
                  admin.statusBreakdown.forEach(status => {
                    statusMap[status.status] = (statusMap[status.status] || 0) + status.count;
                  });
                });
                const topStatus = Object.entries(statusMap).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
                return topStatus[1] || 0;
              })()} occurrences
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Overview */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">            {/* Admin Performance Bar Chart */}
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
                  
                  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
                  const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                  
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
                      center: ['50%', '45%'],
                      data: statusData,
                      emphasis: {
                        itemStyle: {
                          shadowBlur: 10,
                          shadowOffsetX: 0,
                          shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                      },
                      color: colors
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
                  const trendData = adminNames.slice(0, 5).map(adminName => {
                    const admin = dashboardData.reportStats.find(a => a.adminName === adminName);
                    const data: any = { adminName };
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
                series: statusCategories.map((status, index) => ({
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
                  color: status === 'Selesai Penanganan' || status === 'Selesai Pengaduan' || status === 'Ditutup'
                    ? '#10B981'
                    : status === 'Proses OPD Terkait'
                    ? '#3B82F6'
                    : status === 'Perlu Verifikasi'
                    ? '#F59E0B'
                    : '#6B7280'
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
                          <div className="text-sm text-gray-500">ID: {admin.adminId.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.role === 'SuperAdmin' 
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
                          <span key={idx} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            status.status === 'Selesai Penanganan' || status.status === 'Selesai Pengaduan' || status.status === 'Ditutup'
                              ? 'bg-green-100 text-green-800'
                              : status.status === 'Proses OPD Terkait'
                              ? 'bg-blue-100 text-blue-800'
                              : status.status === 'Perlu Verifikasi'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {status.status}: {status.count}
                          </span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {dashboardData.reportStats.slice(0, 4).map((admin) => (
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
                      color: s.status === 'Selesai Penanganan' || s.status === 'Selesai Pengaduan' || s.status === 'Ditutup'
                        ? '#10B981'
                        : s.status === 'Proses OPD Terkait'
                        ? '#3B82F6'
                        : s.status === 'Perlu Verifikasi'
                        ? '#F59E0B'
                        : '#6B7280'
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
                    <div className={`w-3 h-3 rounded-full ${
                      status.status === 'Selesai Penanganan' || status.status === 'Selesai Pengaduan' || status.status === 'Ditutup'
                        ? 'bg-green-500'
                        : status.status === 'Proses OPD Terkait'
                        ? 'bg-blue-500'
                        : status.status === 'Perlu Verifikasi'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }`}></div>
                    <span className="text-gray-600">{status.status}</span>
                  </div>
                  <span className="font-medium text-gray-900">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
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
    </div>
  );
};

export default AdminPerformance;

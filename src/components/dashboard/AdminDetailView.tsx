"use client";

import React, { useState, useEffect } from 'react';
import { 
  FiActivity, 
  FiClock, 
  FiFileText, 
  FiLogIn,
  FiLogOut,
  FiArrowLeft,
  FiCalendar
} from 'react-icons/fi';
import { adminPerformanceService, AdminDetail } from '@/services/adminPerformanceService';

interface AdminDetailViewProps {
  adminId: string;
  onBack: () => void;
}

const AdminDetailView: React.FC<AdminDetailViewProps> = ({ adminId, onBack }) => {
  const [adminDetail, setAdminDetail] = useState<AdminDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const loadAdminDetail = async () => {
    try {
      setLoading(true);
      const data = await adminPerformanceService.getAdminDetail(adminId, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      setAdminDetail(data);
    } catch (error) {
      console.error('Error loading admin detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminDetail();
  }, [adminId, dateRange]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return <FiLogIn className="text-green-600" size={16} />;
      case 'logout':
        return <FiLogOut className="text-red-600" size={16} />;
      case 'process_report':
        return <FiFileText className="text-blue-600" size={16} />;
      default:
        return <FiActivity className="text-gray-600" size={16} />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'logout':
        return 'bg-red-100 text-red-800';
      case 'process_report':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin details...</p>
        </div>
      </div>
    );
  }

  if (!adminDetail) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Admin details not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">
            {adminDetail.adminInfo.nama_admin || adminDetail.adminInfo.username}
          </h2>
          <p className="text-gray-600">{adminDetail.adminInfo.role} Performance Details</p>
        </div>
        
        {/* Date Range Controls */}
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-400" size={16} />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiActivity className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{adminDetail.activities.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiClock className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{adminDetail.sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiFileText className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Reports Processed</p>
              <p className="text-2xl font-bold text-gray-900">{adminDetail.processedReports.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiClock className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Session Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {adminDetail.sessions.length > 0 
                  ? formatDuration(
                      adminDetail.sessions.reduce((total, session) => total + session.sessionDuration, 0) / 
                      adminDetail.sessions.length
                    )
                  : '0h 0m'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {adminDetail.activities.slice(0, 10).map((activity) => (
                <div key={activity._id} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {getActivityIcon(activity.activityType)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.activityType)}`}>
                        {activity.activityType.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mt-1">{activity.description}</p>
                    {activity.relatedReport && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <p className="text-blue-800">
                          Report #{activity.relatedReport.sessionId}: {activity.relatedReport.message.substring(0, 50)}...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Login Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Login Sessions</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {adminDetail.sessions.slice(0, 10).map((session) => (
                <div key={session._id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      session.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.isActive ? 'Active' : 'Completed'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDuration(session.sessionDuration)}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <FiLogIn className="text-green-600" size={14} />
                      <span className="text-gray-600">Login:</span>
                      <span className="text-gray-900">{formatDateTime(session.loginTime)}</span>
                    </div>
                    
                    {session.logoutTime && (
                      <div className="flex items-center gap-2">
                        <FiLogOut className="text-red-600" size={14} />
                        <span className="text-gray-600">Logout:</span>
                        <span className="text-gray-900">{formatDateTime(session.logoutTime)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <FiActivity className="text-blue-600" size={14} />
                      <span className="text-gray-600">Activities:</span>
                      <span className="text-gray-900">{session.activityCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Processed Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Processed Reports</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adminDetail.processedReports.map((report) => (
                <tr key={report._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{report.sessionId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {report.message}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {report.tindakan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.tindakan.trackingId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(report.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDetailView;

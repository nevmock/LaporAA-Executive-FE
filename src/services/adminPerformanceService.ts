import axiosInstance from '@/utils/axiosInstance';

// Types based on the API documentation
export interface AdminPerformanceDashboard {
  dateRange: {
    start: string;
    end: string;
  };
  adminStats: AdminStat[];
  reportStats: ReportStat[];
  activityStats: ActivityStat[];
  onlineStats: OnlineStat[];
}

export interface AdminStat {
  adminId: string;
  adminName: string;
  username?: string; // Optional username field
  role: string;
  totalActivities: number;
  reportActivities: number;
  lastActivity: string;
}

export interface ReportStat {
  adminId: string;
  adminName: string;
  username?: string; // Optional username field
  role: string;
  totalProcessed: number;
  statusBreakdown: {
    status: string;
    count: number;
  }[];
}

export interface ActivityStat {
  date: string;
  adminId: string;
  adminName: string;
  username?: string; // Optional username field
  totalActivities: number;
  activities: {
    type: string;
    count: number;
  }[];
}

export interface OnlineStat {
  adminId: string;
  adminName: string;
  role: string;
  totalSessions: number;
  totalDuration: number;
  avgDuration: number;
  lastLogin: string;
  isCurrentlyOnline: boolean;
}

export interface AdminDetail {
  adminInfo: {
    _id: string;
    nama_admin: string;
    username: string;
    role: string;
  };
  activities: AdminActivity[];
  sessions: AdminSession[];
  processedReports: ProcessedReport[];
  dateRange: {
    start: string;
    end: string;
  };
}

export interface AdminActivity {
  _id: string;
  activityType: string;
  description: string;
  createdAt: string;
  relatedReport?: {
    _id: string;
    sessionId: string;
    message: string;
  };
}

export interface AdminSession {
  _id: string;
  loginTime: string;
  logoutTime?: string;
  sessionDuration: number;
  isActive: boolean;
  activityCount: number;
}

export interface ProcessedReport {
  _id: string;
  sessionId: string;
  message: string;
  createdAt: string;
  tindakan: {
    status: string;
    trackingId: number;
  };
}

export interface OnlineStatus {
  totalOnline: number;
  totalActive: number;
  adminList: {
    adminId: string;
    adminName: string;
    role: string;
    loginTime: string;
    lastActivity: string;
    sessionDuration: number;
    activityCount: number;
    isOnline: boolean;
  }[];
}

export interface MonthlyReport {
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  totalActivities: number;
  totalReportsProcessed: number;
  avgResponseTime: number;
  adminProductivity: Array<{
    admin: string;
    processed: number;
    avgTime: number;
    rating: number;
  }>;
}

export const adminPerformanceService = {
  // Get dashboard data
  getDashboard: async (params?: {
    startDate?: string;
    endDate?: string;
    adminId?: string;
  }): Promise<AdminPerformanceDashboard> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.adminId) queryParams.append('adminId', params.adminId);
    
    const response = await axiosInstance.get(`/performance/dashboard?${queryParams.toString()}`);
    return response.data;
  },

  // Get specific admin details
  getAdminDetail: async (adminId: string, params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AdminDetail> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await axiosInstance.get(`/performance/admin/${adminId}?${queryParams.toString()}`);
    return response.data;
  },

  // Get real-time online status
  getOnlineStatus: async (): Promise<OnlineStatus> => {
    const response = await axiosInstance.get('/performance/status');
    return response.data;
  },

  // Get monthly report
  getMonthlyReport: async (params?: {
    year?: number;
    month?: number;
  }): Promise<MonthlyReport> => {
    const queryParams = new URLSearchParams();
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    
    const response = await axiosInstance.get(`/performance/monthly?${queryParams.toString()}`);
    return response.data;
  },

  // Get reports by status for specific admin
  getReportsByStatus: async (params: {
    adminId: string;
    status: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    processedAt?: string;
  }>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('adminId', params.adminId);
    queryParams.append('status', params.status);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const response = await axiosInstance.get(`/performance/reports-by-status?${queryParams.toString()}`);
    return response.data?.reports || [];
  },
};

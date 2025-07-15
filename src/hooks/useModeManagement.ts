import { useState, useCallback } from 'react';
import axios from '../utils/axiosInstance';

interface ModeHistoryEntry {
  id: string;
  from: string;
  mode: string;
  previousMode: string;
  changedAt: string;
  changedBy: string;
  changedByType: string;
  reason?: string;
  duration?: number;
  forceMode: boolean;
  sessionId?: string;
}

interface ModeScheduleEntry {
  id: string;
  from: string;
  mode: string;
  startTime: string;
  endTime: string;
  recurring: boolean;
  daysOfWeek: number[];
  active: boolean;
  createdBy: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

interface ModeStatistics {
  totalUsers: number;
  botModeUsers: number;
  manualModeUsers: number;
  forceModeUsers: number;
  averageManualDuration: number;
  modeChangesToday: number;
  hourlyStats: Array<{
    _id: { hour: number; mode: string };
    count: number;
  }>;
}

interface ActiveUser {
  _id: string;
  from: string;
  mode: string;
  manualModeUntil: string | null;
  forceModeManual: boolean;
  updatedAt: string;
  effectiveMode: string;
}

export const useModeManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Mode History
  const getModeHistory = useCallback(async (userId?: string, limit = 50, offset = 0) => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = userId 
        ? `/mode-management/history/${userId}?limit=${limit}&offset=${offset}`
        : `/mode-management/history?limit=${limit}&offset=${offset}`;
      
      const response = await axios.get(endpoint);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mode history';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mode Schedules
  const getModeSchedules = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/mode-management/schedules/${userId}`);
      return response.data.schedules;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mode schedules';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createModeSchedule = useCallback(async (schedule: {
    from: string;
    mode: string;
    startTime: string;
    endTime: string;
    recurring?: boolean;
    daysOfWeek?: number[];
    createdBy: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/mode-management/schedules', schedule);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create mode schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateModeSchedule = useCallback(async (scheduleId: string, updates: Partial<ModeScheduleEntry>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.put(`/mode-management/schedules/${scheduleId}`, updates);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update mode schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteModeSchedule = useCallback(async (scheduleId: string) => {
    setLoading(true);
    setError(null);

    try {
      await axios.delete(`/mode-management/schedules/${scheduleId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mode schedule';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk Mode Management
  const bulkChangeModes = useCallback(async (data: {
    users: string[];
    mode: string;
    changedBy: string;
    reason?: string;
    duration?: number;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/mode-management/bulk-mode-change', data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk mode change';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mode Statistics
  const getModeStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/mode-management/statistics');
      return response.data as ModeStatistics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mode statistics';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Active Users
  const getActiveUsers = useCallback(async (limit = 50, offset = 0, mode?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
      if (mode) params.append('mode', mode);
      
      const response = await axios.get(`/mode-management/active-users?${params}`);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch active users';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Custom Duration
  const setCustomDuration = useCallback(async (data: {
    from: string;
    duration: number;
    changedBy: string;
    reason?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/mode-management/custom-duration', data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set custom duration';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError,
    
    // Mode History
    getModeHistory,
    
    // Mode Schedules
    getModeSchedules,
    createModeSchedule,
    updateModeSchedule,
    deleteModeSchedule,
    
    // Bulk Management
    bulkChangeModes,
    
    // Statistics
    getModeStatistics,
    
    // Active Users
    getActiveUsers,
    
    // Custom Duration
    setCustomDuration,
  };
};

export type {
  ModeHistoryEntry,
  ModeScheduleEntry,
  ModeStatistics,
  ActiveUser,
};

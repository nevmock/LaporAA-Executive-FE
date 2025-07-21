import { useState, useEffect, useCallback, useRef } from 'react';
import { ReportTemplate } from '../types/ReportTemplate';
import axiosInstance from '../../../../../utils/axiosInstance';

// Types untuk API response - disesuaikan dengan backend API
interface SummaryStatistics {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  resolutionRate: number;
  averageResolutionDays: number;
}

interface TrendDataPoint {
  date: string;
  count: number;
  resolved?: number;
}

interface TrendData {
  daily: TrendDataPoint[];
  resolution: TrendDataPoint[];
}

interface LocationStatistic {
  kecamatan: string;
  desa?: string;
  total: number;
  resolved: number;
  pending: number;
  resolutionRate: number;
}

interface LocationStatistics {
  byLocation: LocationStatistic[];
  byKecamatan: Omit<LocationStatistic, 'desa'>[];
}

interface OPDStatistic {
  opd: string;
  total: number;
  resolved: number;
  pending: number;
  resolutionRate: number;
  avgRating: number;
}

interface CategoryStatistic {
  category: string;
  total: number;
  resolved: number;
  pending: number;
  resolutionRate: number;
  avgRating: number;
}

interface SatisfactionScore {
  rating: number;
  count: number;
  percentage: string;
}

interface SatisfactionStatistics {
  averageRating: number;
  totalRated: number;
  distribution: SatisfactionScore[];
  feedbackStats: Array<{
    _id: string;
    count: number;
  }>;
}

interface MapDataPoint {
  type: "Feature";
  properties: {
    sessionId: string;
    message: string;
    location: string;
    kecamatan: string;
    desa: string;
    status: string;
    createdAt: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface MapData {
  type: "FeatureCollection";
  features: MapDataPoint[];
}

interface CompleteAnalyticsData {
  summary: SummaryStatistics;
  trend: TrendData;
  location: LocationStatistics;
  opd: OPDStatistic[];
  category: CategoryStatistic[];
  satisfaction: SatisfactionStatistics;
  map: MapData;
}

// Retry utility function dengan exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Hook untuk mengambil data lengkap analytics dari backend API
 */
export const useReportData = (template: ReportTemplate) => {
  const [data, setData] = useState<CompleteAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref untuk abort controller dan tracking initial load
  const abortControllerRef = useRef<AbortController | null>(null);
  const isInitialLoadRef = useRef(true);
  const lastParamsRef = useRef<string>('');

  const fetchData = useCallback(async () => {
    // Generate date range berdasarkan template atau default ke periode seminggu terakhir
    const endDate = template?.endDate || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const startDate = template?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Create cache key untuk menghindari duplicate requests
    const paramsKey = `${startDate}-${endDate}`;
    if (lastParamsRef.current === paramsKey && !isInitialLoadRef.current) {
      console.log('Skipping duplicate request for same parameters');
      return;
    }
    
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      console.log('Cancelling previous request...');
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching analytics data:', { startDate, endDate });
      
      // Function untuk request API dengan retry mechanism
      const fetchWithRetry = () => axiosInstance.get(`/api/reports/analytics/complete`, {
        signal: abortControllerRef.current?.signal,
        params: {
          startDate,
          endDate
        },
        timeout: 30000 // 30 seconds timeout per request
      });

      // Execute request dengan retry mechanism
      const response = await retryWithBackoff(fetchWithRetry, 3, 1000);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        console.log('Request was aborted');
        return;
      }
      
      if (response.data.success) {
        setData(response.data.data);
        setError(null);
        lastParamsRef.current = paramsKey;
        console.log('Analytics data loaded successfully:', response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat data laporan');
      }
      
    } catch (err: any) {
      // Don't set error if request was aborted (user navigated away or new request started)
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        console.log('Request aborted');
        return;
      }

      console.error('Error fetching report data:', err);
      
      // Handle different types of errors with user-friendly messages
      if (err.response?.status === 401) {
        setError('Sesi telah berakhir. Silakan login kembali.');
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || 'Parameter tanggal tidak valid');
      } else if (err.response?.status === 500) {
        setError('Terjadi kesalahan server. Silakan coba lagi nanti.');
      } else if (err.response?.status === 503) {
        setError('Server sedang maintenance. Silakan coba beberapa saat lagi.');
      } else if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Koneksi timeout. Silakan periksa koneksi internet Anda dan coba lagi.');
      } else if (err.code === 'NETWORK_ERROR' || !navigator.onLine) {
        setError('Tidak ada koneksi internet. Silakan periksa koneksi Anda.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        setError(err.response?.data?.message || 'Gagal memuat data laporan. Silakan coba lagi.');
      }
      
      // Set data ke null saat error
      setData(null);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      isInitialLoadRef.current = false;
    }
  }, [template?.startDate, template?.endDate]);

  const refetch = useCallback(() => {
    console.log('Manual refetch triggered');
    lastParamsRef.current = ''; // Reset cache key untuk force refresh
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // Initial load atau load ketika template berubah
    fetchData();

    // Cleanup function untuk abort request saat component unmount atau dependency berubah
    return () => {
      if (abortControllerRef.current) {
        console.log('Cleaning up: aborting request');
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch
  };
};

// Export types untuk digunakan di komponen lain
export type {
  SummaryStatistics,
  TrendData,
  LocationStatistics,
  OPDStatistic,
  CategoryStatistic,
  SatisfactionStatistics,
  MapData,
  CompleteAnalyticsData,
};

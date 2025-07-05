import { useState, useEffect } from 'react';
import axios from '../utils/axiosInstance';

interface AvailablePeriodsData {
  availableMonths: number[];
  availableYears: number[];
  currentMonth: number;
  currentYear: number;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export function useAvailablePeriods(year?: number) {
  const [data, setData] = useState<AvailablePeriodsData>({
    availableMonths: [],
    availableYears: [],
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear()
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailablePeriods = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = year ? { year } : {};
        const response = await axios.get(`${API_URL}/dashboard/available-periods`, { params });
        setData(response.data);
      } catch (err) {
        console.error('Error fetching available periods:', err);
        setError('Failed to fetch available periods');
        // Set fallback data
        setData({
          availableMonths: [],
          availableYears: [],
          currentMonth: new Date().getMonth() + 1,
          currentYear: new Date().getFullYear()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailablePeriods();
  }, [year]);

  // Helper functions for building filter options
  const getAvailableMonthOptions = () => {
    return data.availableMonths.map(month => ({
      label: MONTH_NAMES[month - 1],
      value: month
    }));
  };

  const getAllMonthOptions = () => {
    return MONTH_NAMES.map((name, index) => ({
      label: name,
      value: index + 1
    }));
  };

  const getAvailableYearOptions = () => {
    return data.availableYears;
  };

  const getAllYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  // Check if a specific month has data
  const hasDataForMonth = (month: number) => {
    return data.availableMonths.includes(month);
  };

  // Check if a specific year has data
  const hasDataForYear = (checkYear: number) => {
    return data.availableYears.includes(checkYear);
  };

  // Get the best default month (latest available, or current if available)
  const getDefaultMonth = () => {
    if (data.availableMonths.length === 0) {
      return data.currentMonth;
    }
    
    // If current month has data, use it
    if (data.availableMonths.includes(data.currentMonth)) {
      return data.currentMonth;
    }
    
    // Otherwise use the latest available month
    return Math.max(...data.availableMonths);
  };

  // Get the best default year (current if available, otherwise latest)
  const getDefaultYear = () => {
    if (data.availableYears.length === 0) {
      return data.currentYear;
    }
    
    // If current year has data, use it
    if (data.availableYears.includes(data.currentYear)) {
      return data.currentYear;
    }
    
    // Otherwise use the latest available year
    return Math.max(...data.availableYears);
  };

  return {
    data,
    loading,
    error,
    // Helper functions
    getAvailableMonthOptions,
    getAllMonthOptions,
    getAvailableYearOptions,
    getAllYearOptions,
    hasDataForMonth,
    hasDataForYear,
    getDefaultMonth,
    getDefaultYear,
    // Quick access
    availableMonths: data.availableMonths,
    availableYears: data.availableYears,
    currentMonth: data.currentMonth,
    currentYear: data.currentYear
  };
}

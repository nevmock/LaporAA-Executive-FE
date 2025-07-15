// Modern Dashboard Components
// Task 1.1: Modern Component Library for Dashboard
// All components use ECharts instead of ApexCharts

export { default as ModernStatCard } from './ModernStatCard';
export { default as ModernChartCard } from './ModernChartCard';
export { default as DashboardHeader } from './DashboardHeader';
export { default as ExportButton } from './ExportButton';
export { default as InfoModal } from './InfoModal';
export { default as FilterControls } from './FilterControls';
export { default as FullscreenModal } from './FullscreenModal';

// Re-export types
export type { EChartsOption } from 'echarts';

// Common chart configurations for ECharts
export const chartThemes = {
  light: {
    backgroundColor: '#ffffff',
    textStyle: {
      color: '#374151'
    },
    grid: {
      borderColor: '#e5e7eb'
    }
  },
  dark: {
    backgroundColor: '#1f2937',
    textStyle: {
      color: '#f3f4f6'
    },
    grid: {
      borderColor: '#4b5563'
    }
  }
};

// Common color palettes
export const colorPalettes = {
  primary: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  danger: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  info: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  gradient: [
    {
      type: 'linear',
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: '#3b82f6' },
        { offset: 1, color: '#1d4ed8' }
      ]
    }
  ]
};

// Common chart options
export const defaultChartOptions = {
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '8%',
    containLabel: true
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderColor: '#374151',
    textStyle: {
      color: '#ffffff'
    }
  },
  legend: {
    top: 'bottom',
    textStyle: {
      fontSize: 12
    }
  },
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicOut'
};

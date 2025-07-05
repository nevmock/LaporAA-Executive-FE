'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { EChartsOption } from 'echarts';
import { ModernChartCard, colorPalettes, FilterControls } from '../modern';
import { useAvailablePeriods } from '../../../hooks/useAvailablePeriods';
import dayjs from 'dayjs';
import axios from '../../../utils/axiosInstance';

// Filter waktu yang tersedia
const FILTERS = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

// Urutan status yang digunakan di chart
const STATUS_ORDER = [
    'Perlu Verifikasi',
    'Verifikasi Situasi',
    'Verifikasi Kelengkapan Berkas',
    'Proses OPD Terkait',
    'Selesai Penanganan',
    'Selesai Pengaduan',
    'Ditutup',
];

// Warna status sesuai dengan warna marker di map
const STATUS_COLORS: Record<string, string> = {
    'Perlu Verifikasi': '#ef4444',        // red
    'Verifikasi Situasi': '#a855f7',      // violet
    'Verifikasi Kelengkapan Berkas': '#f97316', // orange
    'Proses OPD Terkait': '#eab308',      // yellow
    'Selesai Penanganan': '#3b82f6',      // blue
    'Selesai Pengaduan': '#22c55e',       // green
    'Ditutup': '#374151',                 // black/gray
};

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;
const now = dayjs();

export default function SummaryPieChart() {
    // State filter
    const [filter, setFilter] = useState('monthly');
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    // Gunakan hook untuk mendapatkan periode yang memiliki data
    const {
        getAvailableMonthOptions,
        getAllMonthOptions,
        getAvailableYearOptions,
        getAllYearOptions,
        getDefaultMonth,
        getDefaultYear,
        hasDataForMonth,
        loading: periodsLoading
    } = useAvailablePeriods(year);

    // Set default values berdasarkan data yang tersedia
    useEffect(() => {
        if (!periodsLoading) {
            // Set default month ke bulan yang memiliki data (jika filter monthly/weekly)
            if ((filter === 'monthly' || filter === 'weekly') && !hasDataForMonth(month)) {
                const defaultMonth = getDefaultMonth();
                if (defaultMonth !== month) {
                    setMonth(defaultMonth);
                }
            }
            
            // Set default year jika tahun saat ini tidak memiliki data
            const defaultYear = getDefaultYear();
            if (defaultYear !== year) {
                setYear(defaultYear);
            }
        }
    }, [periodsLoading, filter, hasDataForMonth, month, getDefaultMonth, getDefaultYear, year]);

    const getWeeksInMonth = (y: number, m: number) => {
        const start = dayjs(`${y}-${m}-01`);
        const end = start.endOf('month');
        let count = 1;
        let cursor = start.startOf('week').add(1, 'day');
        while (cursor.isBefore(end)) {
            count++;
            cursor = cursor.add(1, 'week');
        }
        return Array.from({ length: count }, (_, i) => i + 1);
    };

    // Ambil data rekap status dari API
    const fetchStatusSummary = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}/dashboard/status-summary?mode=${filter}&year=${year}`;
            if (filter !== 'yearly') url += `&month=${month}`;
            if (filter === 'weekly') url += `&week=${week}`;
            const res = await axios.get(url);
            setStatusCounts(res.data ?? {});
        } catch {
            setStatusCounts({});
        } finally {
            setLoading(false);
        }
    };

    // Export data ke CSV
    const handleDownloadCSV = () => {
        const csv = [
            'Status,Total',
            ...STATUS_ORDER.map(status => `"${status}",${statusCounts[status] || 0}`),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `piechart-summary-${filter}-${year}${filter !== 'yearly' ? `-${month}` : ''}${filter === 'weekly' ? `-minggu${week}` : ''}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Check if all data is zero
    const allZero = Object.values(statusCounts).every(count => count === 0);

    // Prepare chart data
    const data = STATUS_ORDER.map(status => ({
        name: status,
        value: statusCounts[status] || 0,
        itemStyle: {
            color: STATUS_COLORS[status] || '#6b7280'
        }
    })).filter(item => item.value > 0);

    // ECharts configuration
    const chartOptions: EChartsOption = useMemo(() => {
        if (allZero) {
            return {
                backgroundColor: '#ffffff',
                series: [{
                    type: 'pie',
                    data: [{ name: 'Tidak ada data', value: 1 }],
                    radius: '60%',
                    center: ['50%', '50%'],
                    label: {
                        show: true,
                        position: 'center',
                        formatter: 'Tidak ada data',
                        fontSize: 18,
                        color: '#9ca3af',
                    },
                    itemStyle: { color: '#f3f4f6' },
                    emphasis: { disabled: true }
                }],
                tooltip: { show: false }
            };
        }

        return {
            backgroundColor: '#ffffff',
            tooltip: { 
                trigger: 'item',
                formatter: '{b}: {c} ({d}%)<br/><i style="color: #60a5fa;">💡 Klik untuk melihat detail</i>',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#374151',
                textStyle: {
                    color: '#ffffff'
                }
            },
            legend: { 
                orient: 'horizontal', 
                bottom: '2%',
                textStyle: {
                    fontSize: 11,
                    color: '#374151'
                },
                itemGap: 15,
                itemWidth: 10,
                itemHeight: 10
            },
            series: [{
                name: 'Status',
                type: 'pie',
                radius: '70%',
                center: ['50%', '50%'],
                data,
                label: {
                    show: true,
                    formatter: '{b}: {d}%',
                    position: 'outside',
                    fontSize: 11,
                    color: '#374151',
                    fontWeight: 'normal'
                },
                labelLine: { 
                    show: true,
                    length: 15,
                    length2: 8,
                    lineStyle: {
                        color: '#9ca3af'
                    }
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 15,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)',
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    scale: true,
                    scaleSize: 5
                },
            }],
            animation: true,
            animationDuration: 1000,
            animationEasing: 'cubicOut'
        };
    }, [statusCounts, allZero, data]);

    // Handle chart click events for navigation
    const handleChartClick = (params: any) => {
        const status = params?.name;
        if (!status || !STATUS_ORDER.includes(status)) return;
        sessionStorage.setItem('statusClicked', status);
        window.location.href = '/pengaduan';
    };

    // Handle fullscreen - open in new tab
    const handleFullscreen = () => {
        window.open('/chart-fullscreen?type=summary-pie', '_blank');
    };

    // Handle info modal
    const handleInfo = () => {
        alert('Chart ini menampilkan distribusi status pengaduan. Klik pada segmen chart untuk melihat detail pengaduan dengan status tersebut.');
    };

    // Reset minggu saat bulan/tahun/filter berubah
    useEffect(() => {
        setWeek(1);
    }, [month, year, filter]);

    // Fetch data saat filter berubah
    useEffect(() => {
        fetchStatusSummary();
    }, [filter, year, month, week]);

    // ===== AUTO REFRESH: Fetch data baru tiap 5 menit =====
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStatusSummary();
        }, 5 * 60 * 1000); // 5 menit
        return () => clearInterval(interval);
    }, [filter, year, month, week]);
    // ======================================================

    const weekOptions = getWeeksInMonth(year, month);

    // Handle refresh
    const handleRefresh = () => {
        fetchStatusSummary();
    };

    // Filter controls component
    const filterControls = (
        <FilterControls
            filters={{
                timeFilter: {
                    value: filter,
                    onChange: setFilter,
                    options: FILTERS
                },
                year: {
                    value: year,
                    onChange: setYear,
                    options: getAllYearOptions()
                },
                month: {
                    value: month,
                    onChange: setMonth,
                    options: getAvailableMonthOptions(),
                    show: filter === 'monthly' || filter === 'weekly'
                },
                week: {
                    value: week,
                    onChange: setWeek,
                    options: weekOptions,
                    show: filter === 'weekly'
                }
            }}
        />
    );

    return (
        <ModernChartCard
            title="Distribusi Status Pengaduan"
            subtitle="Ringkasan status pengaduan dalam bentuk pie chart"
            chartType="pie"
            option={chartOptions}
            loading={loading}
            error={allZero ? "Tidak ada data status" : null}
            color="blue"
            onDownload={handleDownloadCSV}
            onInfo={handleInfo}
            onChartClick={handleChartClick}
            showRefresh={false}
            showDownload={true}
            showFullscreen={true}
            showInfo={true}
            height={400}
            className="h-full"
            filters={filterControls}
            useInternalFullscreen={true}
        />
    );
}

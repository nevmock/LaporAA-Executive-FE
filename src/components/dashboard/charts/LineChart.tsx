'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { EChartsOption } from 'echarts';
import { ModernChartCard, colorPalettes, defaultChartOptions, FilterControls } from '../modern';
import { useAvailablePeriods } from '../../../hooks/useAvailablePeriods';
import axios from '../../../utils/axiosInstance';
import dayjs from 'dayjs';

// Base URL dari backend
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

// Pilihan filter waktu
const FILTERS = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

// Label bulan untuk ditampilkan di UI dan CSV
const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const now = dayjs();

export default function LineChart() {
    // State filter waktu
    const [filter, setFilter] = useState('monthly');
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);

    // Gunakan hook untuk mendapatkan periode yang memiliki data
    const {
        getAvailableMonthOptions,
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

    // Data chart
    const [categories, setCategories] = useState<string[]>([]);
    const [totals, setTotals] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    // Tahun berjalan + 4 tahun sebelumnya
    const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.year() - i), []);

    // Menghitung jumlah minggu dalam bulan tertentu
    const getWeeksInMonth = (y: number, m: number) => {
        const start = dayjs(`${y}-${m}-01`);
        const end = start.endOf('month');
        let count = 1;
        let current = start.startOf('week').add(1, 'day');
        while (current.isBefore(end)) {
            count++;
            current = current.add(1, 'week');
        }
        return count;
    };

    // Mapping data API ke kategori & total berdasarkan mode (weekly, monthly, yearly)
    const getChartDataByMode = (data: Array<{ date: string; total: number }>) => {
        if (filter === 'weekly') {
            const first = dayjs(`${year}-${month}-01`);
            const start = first.startOf('week').add(1, 'day').add(week - 1, 'week');
            const days = Array.from({ length: 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
            setCategories(['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']);
            setTotals(days.map(d => data.find((item) => item.date === d)?.total ?? 0));
        } else if (filter === 'monthly') {
            const days = Array.from({ length: dayjs(`${year}-${month}-01`).daysInMonth() }, (_, i) =>
                dayjs(`${year}-${month}-${i + 1}`).format('YYYY-MM-DD')
            );
            setCategories(days.map((_, i) => String(i + 1)));
            setTotals(days.map(d => data.find((item) => item.date === d)?.total ?? 0));
        } else {
            setCategories(months);
            setTotals(months.map((_, idx) => {
                const match = data.find((item) => Number(item?.date?.split?.('-')[1]) === idx + 1);
                return match?.total ?? 0;
            }));
        }
    };

    // Reset minggu ke-1 setiap kali filter berubah
    useEffect(() => {
        setWeek(1);
    }, [filter, month, year]);

    // Ambil data dari API berdasarkan filter waktu
    const fetchData = React.useCallback(() => {
        setLoading(true);
        let url = `${API_URL}/dashboard/harian?mode=${filter}&year=${year}`;
        if (filter !== 'yearly') url += `&month=${month}`;
        if (filter === 'weekly') url += `&week=${week}`;

        axios.get(url)
            .then(res => getChartDataByMode(res.data ?? []))
            .catch(() => {
                setCategories([]);
                setTotals([]);
            })
            .finally(() => setLoading(false));
    }, [filter, year, month, week]);

    // Fungsi export data ke format CSV
    const handleDownloadCSV = () => {
        let csv = '';
        if (filter === 'weekly') {
            csv = 'Hari,Tanggal,Bulan,Tahun,Total\n';
            const start = dayjs(`${year}-${month}-01`).startOf('week').add(1, 'day').add(week - 1, 'week');
            Array.from({ length: 7 }, (_, i) => start.add(i, 'day')).forEach((d, i) => {
                csv += `${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]},${d.date()},${months[d.month()]},${d.year()},${totals[i] ?? 0}\n`;
            });
        } else if (filter === 'monthly') {
            csv = 'Tanggal,Bulan,Tahun,Total\n';
            Array.from({ length: totals.length }, (_, i) => {
                csv += `${i + 1},${months[month - 1]},${year},${totals[i] ?? 0}\n`;
            });
        } else {
            csv = 'Bulan,Tahun,Total\n';
            months.forEach((m, i) => {
                csv += `${m},${year},${totals[i] ?? 0}\n`;
            });
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grafik-laporan-${filter}-${year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Cek jika semua data bernilai nol
    const isAllZero = totals.length === 0 || totals.every(v => v === 0);

    // ECharts configuration
    const chartOptions: EChartsOption = useMemo(() => ({
        backgroundColor: '#ffffff',
        grid: {
            left: '10%',
            right: '5%',
            bottom: '20%',
            top: '5%',
            containLabel: true
        },
        tooltip: {
            trigger: 'axis' as const,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: '#374151',
            textStyle: {
                color: '#ffffff'
            },
            formatter: function(params: any) {
                const param = Array.isArray(params) ? params[0] : params;
                return `${param.name}<br/>${param.seriesName}: ${param.value}`;
            }
        },
        xAxis: {
            type: 'category',
            data: categories,
            name: filter === 'yearly' ? 'Bulan' : filter === 'monthly' ? 'Tanggal' : 'Minggu',
            nameLocation: 'middle',
            nameGap: 35,
            nameTextStyle: {
                fontSize: 12,
                fontWeight: 'bold',
                color: '#374151'
            },
            axisLabel: {
                rotate: categories.length > 12 ? 45 : categories.length > 7 ? 30 : 0,
                fontSize: 11,
                color: '#6b7280',
                margin: 8,
                interval: categories.length > 20 ? 'auto' : 0
            },
            axisLine: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            },
            axisTick: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: 'Jumlah Laporan',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: {
                fontSize: 12,
                fontWeight: 'bold',
                color: '#374151'
            },
            axisLabel: {
                fontSize: 11,
                color: '#6b7280'
            },
            axisLine: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#f3f4f6',
                    type: 'dashed'
                }
            }
        },
        series: [{
            name: 'Laporan Masuk',
            type: 'line',
            data: totals,
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            showSymbol: true,
            lineStyle: {
                width: 3,
                color: colorPalettes.primary[0],
                shadowColor: 'rgba(59, 130, 246, 0.3)',
                shadowBlur: 8,
                shadowOffsetY: 2
            },
            itemStyle: {
                color: colorPalettes.primary[0],
                borderColor: '#ffffff',
                borderWidth: 2
            },
            areaStyle: {
                opacity: 0.2,
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: colorPalettes.primary[0] },
                        { offset: 1, color: 'transparent' }
                    ]
                }
            },
            emphasis: {
                focus: 'series',
                itemStyle: {
                    shadowBlur: 15,
                    shadowColor: 'rgba(0, 0, 0, 0.3)',
                    scale: 1.2
                }
            },
            markPoint: {
                data: [
                    { type: 'max', name: 'Maksimum' },
                    { type: 'min', name: 'Minimum' }
                ],
                itemStyle: {
                    color: colorPalettes.primary[1]
                },
                label: {
                    show: false
                }
            }
        }],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
    }), [categories, totals, filter]);

    // Handle data export
    const handleExport = (format: string) => {
        if (format === 'csv') {
            handleDownloadCSV();
        }
        // Add other format handlers as needed
    };

    // Handle chart refresh
    const handleRefresh = () => {
        fetchData();
    };

    const weekOptions = Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1);

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

    // Handle fullscreen - open in new tab
    const handleFullscreen = () => {
        window.open('/chart-fullscreen?type=line-chart', '_blank');
    };

    // Handle info modal
    const handleInfo = () => {
        alert('Chart ini menampilkan tren laporan masuk dari waktu ke waktu. Gunakan filter untuk melihat data per minggu, bulan, atau tahun.');
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchData();
        }, 5 * 60 * 1000); // 5 menit
        console.info("✅ Memperbarui data");
        return () => clearInterval(interval);
    }, [fetchData]);

    return (
        <ModernChartCard
            title="Tren Laporan Masuk"
            subtitle="Grafik tren laporan yang masuk dari waktu ke waktu"
            chartType="line"
            option={chartOptions}
            loading={loading}
            error={isAllZero ? "Tidak ada data laporan" : null}
            color="blue"
            onDownload={handleDownloadCSV}
            onFullscreen={handleFullscreen}
            onInfo={handleInfo}
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

import React, { useEffect, useMemo, useState } from 'react';
import { EChartsOption } from 'echarts';
import { ModernChartCard, colorPalettes, FilterControls } from '../modern';
import { useAvailablePeriods } from '../../../hooks/useAvailablePeriods';
import axios from '../../../utils/axiosInstance';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { getOPDShortName } from '../../../utils/opdMapping';

// Base URL dari environment variable
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

// Opsi filter waktu
const FILTERS = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

const now = dayjs();

function getChartHeight(barCount: number) {
    const barHeight = 50; // px per bar (ubah sesuai kebutuhan)
    const minHeight = 300;
    const maxHeight = 1200;
    return Math.max(minHeight, Math.min(barCount * barHeight, maxHeight));
}

export default function HorizontalBarPerangkatDaerahChart() {
    // State filter dan data chart
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

    // Note: years variable removed as it was unused

    const [data, setData] = useState<{
        categories: string[];
        totals: number[];
        fullLabels: string[];
    }>({
        categories: [],
        totals: [],
        fullLabels: [],
    });

    const chartHeight = useMemo(() => getChartHeight(data.categories.length), [data.categories.length]);

    const getWeeksInMonth = (year: number, month: number) => {
        const first = dayjs(`${year}-${month}-01`);
        const end = first.endOf('month');
        let count = 1;
        let current = first.startOf('week').add(1, 'day');
        while (current.isBefore(end)) {
            count++;
            current = current.add(1, 'week');
        }
        return Array.from({ length: count }, (_, i) => i + 1);
    };

    // Fetch data dari API saat filter berubah
    const fetchData = React.useCallback(() => {
        let url = `${API_URL}/dashboard/perangkat-daerah-summary?mode=${filter}&year=${year}`;
        if (filter === 'monthly' || filter === 'weekly') url += `&month=${month}`;
        if (filter === 'weekly') url += `&week=${week}`;

        axios.get(url)
            .then(res => {
                console.info("🔥 Data fetched:", res.data);
                const resData = res.data || {};
                const formatted = Object.entries(resData)
                    .map(([opd, val]) => {
                        const cleanOPD = opd.trim() === '' ? 'Tidak Ada OPD' : opd;
                        return { 
                            opd: cleanOPD, 
                            shortName: getOPDShortName(cleanOPD),
                            value: Number(val) 
                        };
                    })
                    .sort((a, b) => b.value - a.value);

                setData({
                    categories: formatted.map(f => f.shortName),
                    totals: formatted.map(f => f.value),
                    fullLabels: formatted.map(f => f.opd),
                });
            })
            .catch(() => {
                setData({ categories: [], totals: [], fullLabels: [] });
            });
    }, [filter, year, month, week]);

    // Reset week ke 1 saat filter bulan/tahun berubah
    useEffect(() => {
        setWeek(1);
    }, [month, year, filter]);

    // Fungsi export ke CSV
    const handleDownloadCSV = () => {
        let csv = 'Perangkat Daerah,Total\n';
        data.fullLabels.forEach((fullName, i) => {
            csv += `"${fullName}",${data.totals[i] ?? 0}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `perangkat-daerah-summary-${filter}-${year}${filter !== 'yearly' ? `-${month}` : ''}${filter === 'weekly' ? `-minggu${week}` : ''}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Cek jika semua data nol
    const isAllZero = data.totals.length === 0 || data.totals.every(v => v === 0);

    // Fungsi untuk memotong nama OPD yang terlalu panjang
    const truncateLabel = (label: string, maxLength: number = 10) => {
        if (label.length <= maxLength) return label;
        return label.substring(0, maxLength) + '...';
    };

    // Buat data kategori yang dipotong untuk display
    const truncatedCategories = data.categories.map(cat => truncateLabel(cat));

    // ECharts configuration
    const chartOptions: EChartsOption = useMemo(() => ({
        backgroundColor: '#ffffff',
        grid: {
            left: '18%',
            right: '8%',
            bottom: '15%',
            top: '12%',
            containLabel: true
        },
        tooltip: {
            trigger: 'axis' as const,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderColor: '#374151',
            textStyle: {
                color: '#ffffff'
            },
            formatter: function(params: unknown) {
                const param = Array.isArray(params) ? params[0] : params;
                const typedParam = param as { dataIndex: number; seriesName: string; value: number };
                const fullLabel = data.fullLabels[typedParam.dataIndex] || data.categories[typedParam.dataIndex];
                return `<div style="max-width: 300px; word-wrap: break-word;">${fullLabel}<br/>${typedParam.seriesName}: ${typedParam.value}<br/><i style="color: #60a5fa;">💡 Klik untuk melihat detail</i></div>`;
            }
        },
        xAxis: {
            type: 'value',
            name: 'Total Laporan',
            nameLocation: 'middle',
            nameGap: 40,
            nameTextStyle: {
                fontSize: 13,
                fontWeight: 'bold',
                color: '#374151'
            },
            axisLabel: {
                fontSize: 12,
                color: '#6b7280'
            },
            axisLine: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#f3f4f6'
                }
            }
        },
        yAxis: {
            type: 'category',
            data: truncatedCategories,
            name: 'Perangkat Daerah',
            nameLocation: 'middle',
            nameGap: 120,
            nameTextStyle: {
                fontSize: 13,
                fontWeight: 'bold',
                color: '#374151'
            },
            axisLabel: {
                fontSize: 11,
                color: '#6b7280',
                margin: 8,
                formatter: function(value: string) {
                    return value;
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            },
            axisTick: {
                show: false
            },
            // Tambahkan tooltip untuk axis label
            triggerEvent: true
        },
        series: [{
            name: 'Total Laporan',
            type: 'bar',
            data: data.totals,
            itemStyle: {
                color: colorPalettes.primary[0],
                borderRadius: [0, 4, 4, 0]
            },
            emphasis: {
                itemStyle: {
                    color: colorPalettes.primary[1],
                    shadowBlur: 15,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.3)',
                    borderColor: '#fff',
                    borderWidth: 1
                },
                focus: 'series'
            },
            barWidth: '60%'
        }],
        animation: true,
        animationDuration: 1000,
        animationEasing: 'cubicOut'
    }), [data, truncatedCategories]);

    // Handle chart click events for navigation
    const handleChartClick = (params: { dataIndex?: number }) => {
        if (params.dataIndex !== undefined) {
            const clickedOPD = data.fullLabels[params.dataIndex];
            if (clickedOPD) {
                sessionStorage.setItem('opdClicked', clickedOPD);
                window.location.href = '/pengaduan';
            }
        }
    };

    // Handle fullscreen - open in new tab
    const handleFullscreen = () => {
        window.open('/chart-fullscreen?type=bar-opd', '_blank');
    };

    // Handle info modal
    const handleInfo = () => {
        alert('Chart ini menampilkan distribusi laporan berdasarkan Organisasi Perangkat Daerah (OPD) yang menangani. Klik pada bar untuk melihat detail laporan dari OPD tersebut.');
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

    const weekOptions = getWeeksInMonth(year, month);

    // Note: handleRefresh function removed as it was unused

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
            title="Laporan per OPD"
            subtitle="Distribusi laporan berdasarkan OPD yang menangani"
            chartType="bar"
            option={chartOptions}
            loading={false}
            error={isAllZero ? "Tidak ada data laporan" : null}
            color="indigo"
            onDownload={handleDownloadCSV}
            onFullscreen={handleFullscreen}
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

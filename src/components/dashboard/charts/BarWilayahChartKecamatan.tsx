'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { EChartsOption } from 'echarts';
import { ModernChartCard, colorPalettes, FilterControls } from '../modern';
import { useAvailablePeriods } from '../../../hooks/useAvailablePeriods';
import axios from '../../../utils/axiosInstance';
import dayjs from 'dayjs';

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

// Opsi filter waktu (mingguan, bulanan, tahunan)
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

export default function BarWilayahChartKecamatan() {
    // State filter waktu dan wilayah
    const [filter, setFilter] = useState('monthly');
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);
    const [selectedKecamatan, setSelectedKecamatan] = useState('');

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

    // Generate years array (last 5 years)
    const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.year() - i), []);

    // Chart data state
    const [data, setData] = useState<{
        allKecamatan: string[];
        categories: string[];
        totals: number[];
    }>({
        allKecamatan: [],
        categories: [],
        totals: [],
    });

    const chartHeight = useMemo(() => getChartHeight(data.categories.length), [data.categories.length]);

    // Hitung jumlah minggu dalam 1 bulan
    const getWeeksInMonth = (year: number, month: number) => {
        const first = dayjs(`${year}-${month}-01`);
        const last = first.endOf('month');
        let count = 1;
        let current = first.startOf('week').add(1, 'day');
        while (current.isBefore(last)) {
            count++;
            current = current.add(1, 'week');
        }
        return count;
    };

    // Ambil data dari API saat filter berubah
    const fetchData = React.useCallback(() => {
        let url = `${API_URL}/dashboard/wilayah-summary?mode=${filter}&year=${year}`;
        if (filter !== 'yearly') url += `&month=${month}`;
        if (filter === 'weekly') url += `&week=${week}`;

        axios.get(url)
            .then(res => {
                const source = res.data ?? {};
                const kecSet = new Set<string>();
                const kecValueMap: Record<string, number> = {};

                // Loop semua kecamatan dan akumulasi nilai laporan
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                Object.entries(source).forEach(([_, kecs]) => {
                    Object.entries(kecs as Record<string, unknown>).forEach(([kec, desas]) => {
                        kecSet.add(kec);
                        let total = 0;
                        Object.values(desas as Record<string, unknown>).forEach((val) => {
                            total += Number(val);
                        });
                        kecValueMap[kec] = (kecValueMap[kec] || 0) + total;
                    });
                });

                // Jika ada kecamatan terpilih, tampilkan per desa
                if (selectedKecamatan) {
                    const desaMap: Record<string, number> = {};
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    Object.entries(source).forEach(([_, kecs]) => {
                        const desas = (kecs as Record<string, unknown>)[selectedKecamatan];
                        if (desas) {
                            Object.entries(desas as Record<string, unknown>).forEach(([desa, val]) => {
                                desaMap[desa] = (desaMap[desa] || 0) + Number(val);
                            });
                        }
                    });

                    const desaEntries = Object.entries(desaMap).sort((a, b) => b[1] - a[1]);

                    setData({
                        allKecamatan: Array.from(kecSet).sort(),
                        categories: desaEntries.map(([desa]) => desa),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        totals: desaEntries.map(([_, val]) => val),
                    });
                } else {
                    // Jika tidak ada kecamatan terpilih, tampilkan total per kecamatan
                    const entries = Object.entries(kecValueMap).sort((a, b) => b[1] - a[1]);

                    setData({
                        allKecamatan: Array.from(kecSet).sort(),
                        categories: entries.map(([kec]) => kec),
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        totals: entries.map(([_, val]) => val),
                    });
                }
            })
            .catch(() => {
                setData({ allKecamatan: [], categories: [], totals: [] });
            });
    }, [filter, year, month, week, selectedKecamatan]);

    // Reset minggu ke-1 jika bulan, tahun, atau filter berubah
    useEffect(() => {
        setWeek(1);
    }, [month, year, filter]);

    // Fungsi untuk download CSV
    const handleDownloadCSV = () => {
        let csv = 'Label,Total\n';
        data.categories.forEach((cat, i) => {
            csv += `"${cat}",${data.totals[i] ?? 0}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wilayah-summary-${filter}-${year}${filter !== 'yearly' ? `-${month}` : ''}${filter === 'weekly' ? `-minggu${week}` : ''}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Cek jika semua data nol (tidak ada laporan)
    const isAllZero = data.totals.length === 0 || data.totals.every(v => v === 0);

    // Fungsi untuk memotong nama wilayah yang terlalu panjang
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
            formatter: function(params: any) {
                const param = Array.isArray(params) ? params[0] : params;
                const fullLabel = data.categories[param.dataIndex];
                return `<div style="max-width: 300px; word-wrap: break-word;">${fullLabel}: ${param.value}<br/><i style="color: #60a5fa;">💡 Klik untuk melihat detail</i></div>`;
            }
        },
        xAxis: {
            type: 'value',
            name: selectedKecamatan ? 'Total per Desa/Kelurahan' : 'Total Laporan',
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
            name: selectedKecamatan ? 'Desa/Kelurahan' : 'Kecamatan',
            nameLocation: 'middle',
            nameGap: 100,
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
            name: selectedKecamatan ? 'Total per Desa/Kelurahan' : 'Total Laporan',
            type: 'bar',
            data: data.totals,
            itemStyle: {
                color: colorPalettes.primary[2],
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
    }), [data, selectedKecamatan, truncatedCategories]);

    // Handle chart click events for navigation
    const handleChartClick = (params: any) => {
        const clicked = data.categories[params.dataIndex];
        if (!clicked) return;
        sessionStorage.setItem('searchClicked', clicked);
        window.location.href = '/pengaduan';
    };

    // Handle refresh
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
                },
                location: {
                    value: selectedKecamatan,
                    onChange: setSelectedKecamatan,
                    options: ['', ...data.allKecamatan],
                    placeholder: 'Semua Kecamatan'
                }
            }}
        />
    );

    // Handle fullscreen - open in new tab
    const handleFullscreen = () => {
        window.open('/chart-fullscreen?type=bar-wilayah', '_blank');
    };

    // Handle info modal
    const handleInfo = () => {
        alert('Chart ini menampilkan distribusi laporan berdasarkan wilayah kecamatan. Gunakan filter kecamatan untuk melihat data spesifik, atau pilih "Semua Kecamatan" untuk overview. Klik pada bar untuk melihat detail laporan dari wilayah tersebut.');
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
            title={`Laporan per ${selectedKecamatan ? 'Desa/Kelurahan' : 'Kecamatan'}`}
            subtitle={`Distribusi laporan berdasarkan lokasi kejadian ${selectedKecamatan ? `di ${selectedKecamatan}` : 'per kecamatan'}`}
            chartType="bar"
            option={chartOptions}
            loading={false}
            error={isAllZero ? "Tidak ada data laporan" : null}
            color="blue"
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

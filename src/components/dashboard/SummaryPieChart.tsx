'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import axios from '../../utils/axiosInstance';

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

// Nama bulan untuk select box
const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;
const now = dayjs();

export default function SummaryPieChart() {
    const chartRef = useRef<HTMLDivElement>(null); // Ref untuk target chart ECharts

    // State filter
    const [filter, setFilter] = useState('monthly');
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    // Daftar tahun terakhir (5 tahun)
    const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

    // Hitung jumlah minggu dalam bulan tertentu
    const getWeeksInMonth = (y: number, m: number) => {
        const start = dayjs(`${y}-${m}-01`);
        const end = start.endOf('month');
        let count = 1;
        let cursor = start.startOf('week').add(1, 'day');
        while (cursor.isBefore(end)) {
            count++;
            cursor = cursor.add(1, 'week');
        }
        return count;
    };

    // Ambil data rekap status dari API
    const fetchStatusSummary = async () => {
        try {
            let url = `${API_URL}/dashboard/status-summary?mode=${filter}&year=${year}`;
            if (filter !== 'yearly') url += `&month=${month}`;
            if (filter === 'weekly') url += `&week=${week}`;
            const res = await axios.get(url);
            setStatusCounts(res.data ?? {});
        } catch {
            setStatusCounts({});
        }
    };

    // Transform data menjadi format yang bisa dibaca pie chart
    const data = STATUS_ORDER.map(status => ({
        name: status,
        value: statusCounts[status] || 0,
    }));

    // Cek apakah semua data bernilai nol
    const allZero = data.every(item => item.value === 0);

    // Export data ke CSV
    const handleDownloadCSV = () => {
        const csv = [
            'Status,Total',
            ...data.map(d => `"${d.name}",${d.value}`),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `piechart-summary-${filter}-${year}${filter !== 'yearly' ? `-${month}` : ''}${filter === 'weekly' ? `-minggu${week}` : ''}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Reset minggu saat bulan/tahun/filter berubah
    useEffect(() => {
        setWeek(1);
    }, [month, year, filter]);

    // Fetch data saat filter berubah
    useEffect(() => {
        fetchStatusSummary();
    }, [filter, year, month, week]);

    // ===== AUTO REFRESH: Fetch data baru tiap 1 menit =====
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStatusSummary();
        }, 5 * 60 * 1000); // 1 menit (ganti ke n * 60 * 1000 untuk n menit)
        return () => clearInterval(interval);
    }, [filter, year, month, week]);
    // ======================================================

    // Render pie chart ECharts
    useEffect(() => {
        if (!chartRef.current) return;
        const chart = echarts.init(chartRef.current);

        // Konfigurasi chart, handle kasus data kosong
        const chartOptions = allZero
            ? {
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
                        color: 'gray',
                    },
                    itemStyle: { color: '#eee' },
                }],
            }
            : {
                color: [
                    '#FF3131', '#5E17EB', '#FF9F12', 'rgb(250, 204, 21)',
                    'rgb(96, 165, 250)', 'rgb(74, 222, 128)', 'black',
                ],
                tooltip: { trigger: 'item' },
                legend: { orient: 'horizontal', bottom: 'bottom' },
                series: [{
                    name: 'Status',
                    type: 'pie',
                    radius: '60%',
                    center: ['50%', '40%'],
                    data,
                    label: {
                        show: true,
                        formatter: '{b}',
                        position: 'outside',
                    },
                    labelLine: { show: true },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)',
                        },
                    },
                }],
            };

        chart.setOption(chartOptions);

        // Navigasi ke halaman '/pengaduan' saat klik pie slice
        chart.on('click', (params: any) => {
            const status = params?.name;
            if (!STATUS_ORDER.includes(status)) return;
            sessionStorage.setItem('statusClicked', status);
            window.location.href = '/pengaduan';
        });

        // Resize responsif saat window berubah ukuran
        const handleResize = () => chart.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            chart.dispose();
            window.removeEventListener('resize', handleResize);
        };
    }, [JSON.stringify(statusCounts)]); // Bisa diganti [statusCounts] saja

    return (
        <div className="w-full h-full flex flex-col">
            {/* Filter control */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Distribusi Status</h4>
                <div className="flex flex-wrap gap-2 items-center justify-end mt-5">
                    {/* Filter waktu */}
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
                        {FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    {/* Filter tahun */}
                    <select value={year} onChange={e => setYear(+e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {/* Filter bulan jika monthly/weekly */}
                    {(filter === 'monthly' || filter === 'weekly') && (
                        <select value={month} onChange={e => setMonth(+e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
                            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    )}
                    {/* Filter minggu jika weekly */}
                    {filter === 'weekly' && (
                        <select value={week} onChange={e => setWeek(+e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
                            {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w}>Minggu ke-{w}</option>
                            ))}
                        </select>
                    )}
                    {/* Tombol Download */}
                    <button
                        type="button"
                        onClick={handleDownloadCSV}
                        className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600"
                    >
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Chart container */}
            <div ref={chartRef} className="w-full flex-1 min-h-[350px] md:min-h-[400px] lg:min-h-[500px]" />
        </div>
    );
}
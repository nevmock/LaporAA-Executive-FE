"use client";

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from '../../utils/axiosInstance';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Base URL dari environment variable
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

// Opsi filter waktu
const FILTERS = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

// Nama-nama bulan untuk dropdown
const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const now = dayjs();

export default function HorizontalBarPerangkatDaerahChart() {
    // State filter dan data chart
    const [filter, setFilter] = useState('monthly');
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);

    const [data, setData] = useState<{
        categories: string[];
        totals: number[];
        fullLabels: string[];
    }>({
        categories: [],
        totals: [],
        fullLabels: [],
    });

    // Tahun 5 terakhir untuk dropdown
    const years = useMemo(() =>
        Array.from({ length: 5 }, (_, i) => now.year() - i),
        []
    );

    // Hitung jumlah minggu dalam bulan tertentu
    const getWeeksInMonth = (year: number, month: number) => {
        const first = dayjs(`${year}-${month}-01`);
        const end = first.endOf('month');
        let count = 1;
        let current = first.startOf('week').add(1, 'day');
        while (current.isBefore(end)) {
            count++;
            current = current.add(1, 'week');
        }
        return count;
    };

    // Fetch data dari API saat filter berubah
    useEffect(() => {
        let url = `${API_URL}/dashboard/perangkat-daerah-summary?mode=${filter}&year=${year}`;
        if (filter === 'monthly' || filter === 'weekly') url += `&month=${month}`;
        if (filter === 'weekly') url += `&week=${week}`;

        axios.get(url)
            .then(res => {
                const resData = res.data || {};
                const formatted = Object.entries(resData)
                    .map(([opd, val]) => ({ opd, value: Number(val) }))
                    .sort((a, b) => b.value - a.value);

                setData({
                    categories: formatted.map(f => f.opd),
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
        data.categories.forEach((cat, i) => {
            csv += `"${cat}",${data.totals[i] ?? 0}\n`;
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

    // Konfigurasi chart Apex
    const chartOptions = useMemo(() => ({
        chart: {
            type: 'bar' as const,
            height: 400,
            toolbar: { show: false },
            events: {
                // Saat OPD di-klik, redirect ke halaman pengaduan dan simpan ke sessionStorage
                dataPointSelection: (_e: any, _ctx: any, config: any) => {
                    const clickedOPD = data.categories[config.dataPointIndex];
                    if (clickedOPD) {
                        // Gunakan key unik untuk dashboard agar tidak konflik dengan halaman pengaduan
                        sessionStorage.setItem('searchClicked', clickedOPD);
                        window.location.href = '/pengaduan';
                    }
                }
            }
        },
        plotOptions: {
            bar: { horizontal: true, borderRadius: 4, barHeight: '60%' }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: data.categories,
            title: { text: 'Total Laporan' },
            labels: { style: { fontSize: '12px' } }
        },
        yaxis: {
            title: { text: 'Perangkat Daerah' },
            labels: { style: { fontSize: '12px' } }
        },
        colors: ['#6366f1'],
        grid: { borderColor: '#eee' },
        tooltip: {
            enabled: true,
            y: {
                formatter: (val: number, opts: any) =>
                    `${data.fullLabels[opts.dataPointIndex] || ''}: ${val}`
            }
        },
        responsive: [{ breakpoint: 480, options: { chart: { height: "100%" } } }],
    }), [data]);

    // Data series untuk chart
    const chartSeries = useMemo(() => [
        { name: 'Total Laporan', data: data.totals }
    ], [data]);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header + Filter */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h4 className="text-lg font-semibold text-gray-800">
                    Penanganan Berdasarkan Perangkat Daerah
                </h4>
                <div className="flex flex-wrap gap-2 items-center justify-end mt-5">
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
                        {FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {(filter === 'monthly' || filter === 'weekly') && (
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
                            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    )}
                    {filter === 'weekly' && (
                        <select value={week} onChange={e => setWeek(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
                            {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w}>Minggu ke-{w}</option>
                            ))}
                        </select>
                    )}
                    <button onClick={handleDownloadCSV} className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600">
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Chart atau Empty State */}
            {isAllZero ? (
                <div className="flex items-center justify-center flex-1 h-[400px] text-gray-400 text-lg font-semibold border border-dashed rounded-xl">
                    Tidak ada data
                </div>
            ) : (
                <div className="flex-1 w-full h-full">
                    <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        width="100%"
                        height={800}
                    />
                </div>
            )}
        </div>
    );
}
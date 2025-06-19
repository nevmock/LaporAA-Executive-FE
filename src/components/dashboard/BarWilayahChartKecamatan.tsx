'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from '../../utils/axiosInstance';
import dayjs from 'dayjs';

// Dynamic import untuk chart agar hanya di-render di client side
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

// Opsi filter waktu (mingguan, bulanan, tahunan)
const FILTERS = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

// Nama bulan untuk dropdown filter bulan
const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const now = dayjs();

<style jsx global>{`
  .apexcharts-bar-series path, 
  .apexcharts-bar-area {
    cursor: pointer !important;
  }
`}</style>

export default function HorizontalBarWilayahChart() {
    // State untuk filter dan waktu
    const [filter, setFilter] = useState('monthly');
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);
    const [selectedKecamatan, setSelectedKecamatan] = useState('');

    // Generate 5 tahun terakhir
    const years = useMemo(() => Array.from({ length: 5 }, (_, i) => now.year() - i), []);

    // State untuk data chart
    const [data, setData] = useState<{
        allKecamatan: string[];
        categories: string[];
        totals: number[];
    }>({
        allKecamatan: [],
        categories: [],
        totals: [],
    });

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
    useEffect(() => {
        let url = `${API_URL}/dashboard/wilayah-summary?mode=${filter}&year=${year}`;
        if (filter !== 'yearly') url += `&month=${month}`;
        if (filter === 'weekly') url += `&week=${week}`;

        axios.get(url)
            .then(res => {
                const source = res.data ?? {};
                const kecSet = new Set<string>();
                const kecValueMap: Record<string, number> = {};

                // Loop semua kecamatan dan akumulasi nilai laporan
                Object.entries(source).forEach(([_, kecs]) => {
                    Object.entries(kecs as any).forEach(([kec, desas]) => {
                        kecSet.add(kec);
                        let total = 0;
                        Object.values(desas as any).forEach((val) => {
                            total += Number(val);
                        });
                        kecValueMap[kec] = (kecValueMap[kec] || 0) + total;
                    });
                });

                // Jika ada kecamatan terpilih, tampilkan per desa
                if (selectedKecamatan) {
                    const desaMap: Record<string, number> = {};
                    Object.entries(source).forEach(([_, kecs]) => {
                        const desas = (kecs as any)[selectedKecamatan];
                        if (desas) {
                            Object.entries(desas).forEach(([desa, val]) => {
                                desaMap[desa] = (desaMap[desa] || 0) + Number(val);
                            });
                        }
                    });

                    const desaEntries = Object.entries(desaMap).sort((a, b) => b[1] - a[1]);

                    setData({
                        allKecamatan: Array.from(kecSet).sort(),
                        categories: desaEntries.map(([desa]) => desa),
                        totals: desaEntries.map(([_, val]) => val),
                    });
                } else {
                    // Jika tidak ada kecamatan terpilih, tampilkan total per kecamatan
                    const entries = Object.entries(kecValueMap).sort((a, b) => b[1] - a[1]);

                    setData({
                        allKecamatan: Array.from(kecSet).sort(),
                        categories: entries.map(([kec]) => kec),
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

    // Opsi konfigurasi chart
    const chartOptions = useMemo(() => ({
        chart: {
            type: 'bar' as const,
            height: 400,
            toolbar: { show: false },
            events: {
                // Saat klik bar, simpan ke sessionStorage dan redirect ke halaman pengaduan
                dataPointSelection: (_e: any, _ctx: any, config: any) => {
                    const clicked = data.categories[config.dataPointIndex];
                    if (!clicked) return;

                    if (!selectedKecamatan) {
                        sessionStorage.setItem('searchClicked', clicked);
                    } else {
                        sessionStorage.setItem('searchClicked', clicked);
                    }

                    window.location.href = '/pengaduan';
                }
            }
        },
        plotOptions: {
            bar: { horizontal: true, borderRadius: 4, barHeight: '60%' }
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories: data.categories,
            title: { text: selectedKecamatan ? 'Total per Desa/Kelurahan' : 'Total Laporan' },
            labels: { style: { fontSize: '12px' } }
        },
        yaxis: {
            title: { text: selectedKecamatan ? 'Desa/Kelurahan' : 'Kecamatan' },
            labels: { style: { fontSize: '12px' } }
        },
        colors: ['#0ea5e9'],
        grid: { borderColor: '#eee' },
        tooltip: {
            enabled: true,
            y: {
                formatter: (val: number, opts: any) => `${data.categories[opts.dataPointIndex]}: ${val}`
            }
        },
        responsive: [{ breakpoint: 480, options: { chart: { height: "100%" } } }],
    }), [data, selectedKecamatan]);

    // Data series chart
    const chartSeries = useMemo(() => [
        { name: 'Total Laporan', data: data.totals }
    ], [data]);

    // Inject CSS secara dinamis jika ApexCharts sudah ada
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
      .apexcharts-bar-series .apexcharts-series path,
      .apexcharts-bar-series .apexcharts-bar-area {
        cursor: pointer !important;
      }
    `;
        document.head.appendChild(style);

        // Bersihkan style waktu unmount
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header dan filter */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                    Lokasi Kejadian Berdasarkan {selectedKecamatan ? 'Desa/Kelurahan' : 'Kecamatan'}
                </h4>
                <div className="flex flex-wrap gap-2 items-center justify-end mt-5">
                    {/* Filter waktu */}
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
                        {FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>

                    {/* Filter tahun */}
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>

                    {/* Filter bulan */}
                    {(filter === 'monthly' || filter === 'weekly') && (
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
                            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    )}

                    {/* Filter minggu */}
                    {filter === 'weekly' && (
                        <select value={week} onChange={e => setWeek(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
                            {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w}>Minggu ke-{w}</option>
                            ))}
                        </select>
                    )}

                    {/* Filter kecamatan */}
                    <select value={selectedKecamatan} onChange={e => setSelectedKecamatan(e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
                        <option value="">Semua Kecamatan</option>
                        {data.allKecamatan.map(k => (
                            <option key={k} value={k}>{k}</option>
                        ))}
                    </select>

                    {/* Tombol download */}
                    <button onClick={handleDownloadCSV} className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600" type="button">
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Chart atau fallback kosong */}
            {isAllZero ? (
                <div className="flex items-center justify-center h-[400px] text-gray-400 text-lg font-semibold border border-dashed rounded-xl">
                    Tidak ada data
                </div>
            ) : (
                <Chart options={chartOptions} series={chartSeries} type="bar" width="100%" height={800} />
            )}
        </div>
    );
}
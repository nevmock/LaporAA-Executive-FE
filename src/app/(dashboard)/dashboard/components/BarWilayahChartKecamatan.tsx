'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from "../../../../utils/axiosInstance";
import dayjs from "dayjs";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const FILTERS = [
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
];

const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const now = dayjs();

export default function HorizontalBarWilayahChart() {
    const [filter, setFilter] = useState("monthly");
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);

    const [selectedKecamatan, setSelectedKecamatan] = useState("");

    const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

    const [categories, setCategories] = useState<string[]>([]);
    const [totals, setTotals] = useState<number[]>([]);
    const [allKecamatan, setAllKecamatan] = useState<string[]>([]);

    const getWeeksInMonth = (year: number, month: number) => {
        const firstDay = dayjs(`${year}-${month}-01`);
        const lastDay = firstDay.endOf('month');
        let week = 1;
        let current = firstDay.startOf('week').add(1, 'day');
        while (current.isBefore(lastDay)) {
            week++;
            current = current.add(1, 'week');
        }
        return week;
    };

    useEffect(() => {
        let url = `${API_URL}/dashboard/wilayah-summary?mode=${filter}&year=${year}`;
        if (filter === "monthly" || filter === "weekly") url += `&month=${month}`;
        if (filter === "weekly") url += `&week=${week}`;
        axios.get(url)
            .then(res => {
                const data = res.data ?? {};
                const flat: { kec: string, value: number }[] = [];
                const kecSet = new Set<string>();
                const kecValueMap: Record<string, number> = {};

                Object.entries(data).forEach(([kab, kecs]) => {
                    Object.entries(kecs as any).forEach(([kec, desas]) => {
                        kecSet.add(kec);
                        let total = 0;
                        Object.values(desas as any).forEach((count) => {
                            total += Number(count);
                        });
                        kecValueMap[kec] = (kecValueMap[kec] || 0) + total;
                    });
                });

                setAllKecamatan(Array.from(kecSet).sort());

                let entries = Object.entries(kecValueMap);
                if (selectedKecamatan) {
                    entries = entries.filter(([kec]) => kec === selectedKecamatan);
                }

                entries.sort((a, b) => b[1] - a[1]);
                setCategories(entries.map(([kec]) => kec));
                setTotals(entries.map(([_, val]) => val));
            })
            .catch(() => {
                setCategories([]);
                setTotals([]);
                setAllKecamatan([]);
            });
    }, [filter, year, month, week, selectedKecamatan]);

    useEffect(() => {
        setWeek(1);
    }, [month, year, filter]);

    const handleDownloadCSV = () => {
        let csv = "Kecamatan,Total\n";
        categories.forEach((cat, i) => {
            csv += `"${cat}",${totals[i] ?? 0}\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wilayah-summary-${filter}-${year}${filter !== "yearly" ? `-${month}` : ""}${filter === "weekly" ? `-minggu${week}` : ""}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const isAllZero = totals.length === 0 || totals.every((v) => v === 0);

    const chartOptions = {
        chart: { type: 'bar' as const, height: 400, toolbar: { show: false } },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: '60%',
            },
        },
        dataLabels: { enabled: false },
        xaxis: {
            categories,
            title: { text: "Total Laporan" },
            labels: { style: { fontSize: '12px' } }
        },
        yaxis: {
            title: { text: "Kecamatan" },
            labels: { style: { fontSize: '12px' } }
        },
        colors: ['#0ea5e9'],
        grid: { borderColor: '#eee' },
        tooltip: {
            enabled: true,
            y: {
                formatter: (val: number, opts: any) => `${categories[opts.dataPointIndex]}: ${val}`,
            }
        },
        responsive: [{ breakpoint: 480, options: { chart: { height: 300 } } }],
    };

    const chartSeries = [{ name: 'Total Laporan', data: totals }];

    return (
        <div className="bg-white shadow-md rounded-xl p-6 w-full h-full">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-lg font-semibold text-gray-800">Lokasi Kejadian Berdasakan Kecamatan</h4>
                <div className="flex flex-wrap gap-2 items-center justify-end">
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
                        {FILTERS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    {(filter === "monthly" || filter === "weekly") && (
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    )}
                    {filter === "weekly" && (
                        <select value={week} onChange={e => setWeek(Number(e.target.value))} className="border rounded px-2 py-1 text-sm">
                            {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w}>Minggu ke-{w}</option>
                            ))}
                        </select>
                    )}
                    <select
                    value={selectedKecamatan}
                    onChange={e => setSelectedKecamatan(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                >
                    <option value="">Semua Kecamatan</option>
                    {allKecamatan.map(kec => (
                        <option key={kec} value={kec}>{kec}</option>
                    ))}
                </select>
                    <button
                        onClick={handleDownloadCSV}
                        className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600"
                        type="button"
                    >
                        Download CSV
                    </button>
                </div>
            </div>
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
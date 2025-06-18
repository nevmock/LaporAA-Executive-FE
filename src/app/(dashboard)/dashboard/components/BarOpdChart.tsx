'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from "../../../../utils/axiosInstance";
import dayjs from "dayjs";
import 'dayjs/locale/id';

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

export default function HorizontalBarPerangkatDaerahChart() {
    const [filter, setFilter] = useState("monthly");
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);

    const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

    const [categories, setCategories] = useState<string[]>([]);
    const [totals, setTotals] = useState<number[]>([]);
    const [fullLabels, setFullLabels] = useState<string[]>([]);

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
        let url = `${API_URL}/dashboard/perangkat-daerah-summary?mode=${filter}&year=${year}`;
        if (filter === "monthly" || filter === "weekly") url += `&month=${month}`;
        if (filter === "weekly") url += `&week=${week}`;

        axios.get(url)
            .then(res => {
                const data = res.data ?? {};
                const flat: { opd: string, value: number }[] = [];

                Object.entries(data).forEach(([opd, count]) => {
                    flat.push({ opd, value: Number(count) });
                });

                flat.sort((a, b) => b.value - a.value);
                setCategories(flat.map(f => f.opd));
                setTotals(flat.map(f => f.value));
                setFullLabels(flat.map(f => f.opd));
            })
            .catch(() => {
                setCategories([]);
                setTotals([]);
                setFullLabels([]);
            });
    }, [filter, year, month, week]);

    useEffect(() => {
        setWeek(1);
    }, [month, year, filter]);

    const handleDownloadCSV = () => {
        let csv = "Perangkat Daerah,Total\n";
        categories.forEach((cat, i) => {
            csv += `"${cat}",${totals[i] ?? 0}\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `perangkat-daerah-summary-${filter}-${year}${filter !== "yearly" ? `-${month}` : ""}${filter === "weekly" ? `-minggu${week}` : ""}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const isAllZero = totals.length === 0 || totals.every(v => v === 0);

    const chartOptions = {
        chart: {
            type: 'bar' as const,
            height: 400,
            toolbar: { show: false },
            events: {
                dataPointSelection: (event: any, chartContext: any, config: any) => {
                    const clickedOPD = categories[config.dataPointIndex];
                    if (clickedOPD) {
                        sessionStorage.setItem('searchOPD', clickedOPD);
                        window.location.href = '/pengaduan';
                    }
                }
            }
        },
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
            title: { text: "Perangkat Daerah" },
            labels: { style: { fontSize: '12px' } }
        },
        colors: ['#6366f1'],
        grid: { borderColor: '#eee' },
        tooltip: {
            enabled: true,
            y: {
                formatter: (val: number, opts: any) => {
                    const idx = opts.dataPointIndex;
                    return `${fullLabels[idx] || ''}: ${val}`;
                }
            }
        },
        responsive: [{ breakpoint: 480, options: { chart: { height: 300 } } }],
    };

    const chartSeries = [{ name: 'Total Laporan', data: totals }];

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
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
                    {(filter === "monthly" || filter === "weekly") && (
                        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
                            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                        </select>
                    )}
                    {filter === "weekly" && (
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

            {isAllZero ? (
                <div className="flex items-center justify-center flex-1 min-h-[400px] text-gray-400 text-lg font-semibold border border-dashed rounded-xl">
                    Tidak ada data
                </div>
            ) : (
                <div className="flex-1 w-full h-full">
                    <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        width="100%"
                        height="100%"
                    />
                </div>
            )}
        </div>
    );

}
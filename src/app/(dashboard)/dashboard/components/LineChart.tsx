'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from "apexcharts";
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

export default function LineChart() {
    const [categories, setCategories] = useState<string[]>([]);
    const [totals, setTotals] = useState<number[]>([]);
    const [filter, setFilter] = useState("monthly");
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);

    const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

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

    useEffect(() => setWeek(1), [month, year, filter]);

    useEffect(() => {
        let url = `${API_URL}/dashboard/harian?mode=${filter}&year=${year}`;
        if (filter === "monthly" || filter === "weekly") url += `&month=${month}`;
        if (filter === "weekly") url += `&week=${week}`;
        axios.get(url)
            .then((res) => {
                const data = res.data ?? [];
                if (filter === "weekly") {
                    const firstOfMonth = dayjs(`${year}-${month}-01`);
                    let startOfWeek = firstOfMonth.startOf('week').add(1, 'day').add(week - 1, 'week');
                    const days = Array.from({ length: 7 }, (_, i) =>
                        startOfWeek.add(i, 'day').format('YYYY-MM-DD')
                    );
                    setCategories(['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']);
                    setTotals(days.map(d => {
                        const found = data.find((item: any) => item.date === d);
                        return found ? found.total : 0;
                    }));
                } else if (filter === "monthly") {
                    const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
                    const days = Array.from({ length: daysInMonth }, (_, i) =>
                        dayjs(`${year}-${month}-${i + 1}`).format('YYYY-MM-DD')
                    );
                    setCategories(days.map((_, i) => String(i + 1)));
                    setTotals(days.map(d => {
                        const found = data.find((item: any) => item.date === d);
                        return found ? found.total : 0;
                    }));
                } else if (filter === "yearly") {
                    setCategories(months);
                    setTotals(months.map((_, idx) => {
                        const found = data.find((item: any) => {
                            if (!item.date) return false;
                            const monthNum = Number(item.date.split('-')[1]);
                            return monthNum === idx + 1;
                        });
                        return found ? found.total : 0;
                    }));
                }
            })
            .catch(() => {
                setCategories([]);
                setTotals([]);
            });
    }, [filter, year, month, week]);

    const handleDownloadCSV = () => {
        let csv = "";
        if (filter === "weekly") {
            csv = "Hari,Tanggal,Bulan,Tahun,Total\n";
            const firstOfMonth = dayjs(`${year}-${month}-01`);
            let startOfWeek = firstOfMonth.startOf('week').add(1, 'day').add(week - 1, 'week');
            const days = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
            days.forEach((d, i) => {
                const found = totals[i] ?? 0;
                csv += `${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][i]},${d.date()},${months[d.month()]},${d.year()},${found}\n`;
            });
        } else if (filter === "monthly") {
            csv = "Tanggal,Bulan,Tahun,Total\n";
            const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
            for (let i = 0; i < daysInMonth; i++) {
                csv += `${i + 1},${months[month - 1]},${year},${totals[i] ?? 0}\n`;
            }
        } else if (filter === "yearly") {
            csv = "Bulan,Tahun,Total\n";
            months.forEach((m, i) => {
                csv += `${m},${year},${totals[i] ?? 0}\n`;
            });
        }
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "laporan-chart.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const chartOptions: ApexOptions = {
        chart: {
            type: 'line',
            height: '100%',
            zoom: { enabled: false },
            toolbar: { show: false }
        },
        colors: ['#0ea5e9'],
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4, hover: { size: 6 } },
        xaxis: {
            categories,
            title: { text: filter === "yearly" ? "Bulan" : "Tanggal" },
            labels: { rotate: -45, style: { fontSize: '12px' } }
        },
        yaxis: { title: { text: "Jumlah Laporan" } },
        dataLabels: { enabled: false },
        legend: { show: false },
    };

    const chartSeries = [{ name: 'Laporan Masuk', data: totals }];
    const isAllZero = totals.length === 0 || totals.every((v) => v === 0);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Grafik Laporan Masuk</h4>
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
                    <button onClick={handleDownloadCSV} className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600" type="button">
                        Download CSV
                    </button>
                </div>
            </div>

            {/* Chart Area */}
            <div className="w-full flex-1 min-h-[350px] md:min-h-[400px] lg:min-h-[500px]">
                {isAllZero ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-lg font-semibold border border-dashed rounded-xl">
                        Tidak ada data
                    </div>
                ) : (
                    <Chart options={chartOptions} series={chartSeries} type="line" width="100%" height="100%" />
                )}
            </div>
        </div>
    );
}
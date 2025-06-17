"use client";
import React, { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";
import dayjs from "dayjs";
import axios from "../../../../utils/axiosInstance";

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

const orderedStatus = [
    "Perlu Verifikasi",
    "Verifikasi Situasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditolak",
];

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const SummaryPieChart: React.FC = () => {
    const chartRef = useRef<HTMLDivElement>(null);

    const [filter, setFilter] = useState("monthly");
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

    const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

    const getWeeksInMonth = (year: number, month: number) => {
        const firstDay = dayjs(`${year}-${month}-01`);
        const lastDay = firstDay.endOf("month");
        let week = 1;
        let current = firstDay.startOf("week").add(1, "day");
        while (current.isBefore(lastDay)) {
            week++;
            current = current.add(1, "week");
        }
        return week;
    };

    useEffect(() => {
        setWeek(1);
    }, [month, year, filter]);

    useEffect(() => {
        let url = `${API_URL}/dashboard/status-summary?mode=${filter}&year=${year}`;
        if (filter === "monthly" || filter === "weekly") url += `&month=${month}`;
        if (filter === "weekly") url += `&week=${week}`;
        axios.get(url)
            .then(res => setStatusCounts(res.data ?? {}))
            .catch(() => setStatusCounts({}));
    }, [filter, year, month, week]);

    const data = orderedStatus.map((status) => ({
        name: status,
        value: statusCounts[status] || 0,
    }));
    const allZero = data.every(item => item.value === 0);

    useEffect(() => {
        if (!chartRef.current) return;

        const chart = echarts.init(chartRef.current);

        if (allZero) {
            chart.setOption({
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
                        color: 'gray'
                    },
                    itemStyle: {
                        color: '#eee'
                    }
                }]
            });
        } else {
            chart.setOption({
                color: [
                    "#FF3131", "#5E17EB", "#FF9F12", "rgb(250, 204, 21)",
                    "rgb(96, 165, 250)", "rgb(74, 222, 128)", "black"
                ],
                tooltip: { trigger: "item" },
                legend: { orient: "horizontal", bottom: "bottom" },
                series: [
                    {
                        name: "Status",
                        type: "pie",
                        radius: "60%",
                        center: ["50%", "40%"],
                        data,
                        avoidLabelOverlap: true,
                        label: {
                            show: true,
                            position: "outside",
                            formatter: "{b}",
                        },
                        labelLine: { show: true, length: 10, length2: 10 },
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                                shadowColor: "rgba(0, 0, 0, 0.5)",
                            },
                        },
                    },
                ],
            });
        }

        const resize = () => chart.resize();
        window.addEventListener("resize", resize);
        return () => {
            chart.dispose();
            window.removeEventListener("resize", resize);
        };
    }, [JSON.stringify(statusCounts)]);

    const handleDownloadCSV = () => {
        let csv = "Status,Total\n";
        data.forEach(item => {
            csv += `"${item.name}",${item.value}\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `piechart-summary-${filter}-${year}${filter !== "yearly" ? `-${month}` : ""}${filter === "weekly" ? `-minggu${week}` : ""}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Distribusi Status</h4>
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
            <div
                ref={chartRef}
                className="w-full flex-1 min-h-[350px] md:min-h-[400px] lg:min-h-[500px]"
            />
        </div>
    );
};

export default SummaryPieChart;
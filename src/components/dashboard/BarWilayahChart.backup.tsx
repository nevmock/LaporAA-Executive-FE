'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from "../../utils/axiosInstance";
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

export default function HorizontalBarWilayahChart() {
    const [filter, setFilter] = useState("monthly");
    const [year, setYear] = useState(now.year());
    const [month, setMonth] = useState(now.month() + 1);
    const [week, setWeek] = useState(1);

    // Filter wilayah
    const [selectedKecamatan, setSelectedKecamatan] = useState("");
    const [selectedDesa, setSelectedDesa] = useState("");

    const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

    // Data chart
    const [categories, setCategories] = useState<string[]>([]);
    const [totals, setTotals] = useState<number[]>([]);
    const [allKecamatan, setAllKecamatan] = useState<string[]>([]);
    const [allDesa, setAllDesa] = useState<string[]>([]);
    const [kecamatanToDesa, setKecamatanToDesa] = useState<Record<string, string[]>>({});
    const [fullLabels, setFullLabels] = useState<string[]>([]);

    // Helper: Hitung jumlah minggu dalam bulan & tahun tertentu
    const getWeeksInMonth = (year: number, month: number) => {
        const firstDay = dayjs(`${year}-${month}-01`);
        const lastDay = firstDay.endOf('month');
        let week = 1;
        let current = firstDay.startOf('week').add(1, 'day'); // Senin
        while (current.isBefore(lastDay)) {
            week++;
            current = current.add(1, 'week');
        }
        return week;
    };

    // Fetch data
    useEffect(() => {
        let url = `${API_URL}/dashboard/wilayah-summary?mode=${filter}&year=${year}`;
        if (filter === "monthly" || filter === "weekly") url += `&month=${month}`;
        if (filter === "weekly") url += `&week=${week}`;
        axios.get(url)
            .then(res => {
                // Flatten data: kabupaten > kecamatan > desa
                const data = res.data ?? {};
                const flat: { kab: string, kec: string, desa: string, label: string, value: number }[] = [];
                const kecSet = new Set<string>();
                const desaSet = new Set<string>();
                const kecDesaMap: Record<string, Set<string>> = {};

                Object.entries(data).forEach(([kab, kecs]) => {
                    Object.entries(kecs as Record<string, unknown>).forEach(([kec, desas]) => {
                        kecSet.add(kec);
                        if (!kecDesaMap[kec]) kecDesaMap[kec] = new Set();
                        Object.entries(desas as Record<string, unknown>).forEach(([desa, count]) => {
                            desaSet.add(desa);
                            kecDesaMap[kec].add(desa);
                            flat.push({
                                kab: kab as string,
                                kec: kec as string,
                                desa: desa as string,
                                label: `${kec} / ${desa}`,
                                value: count as number
                            });
                        });
                    });
                });
                setAllKecamatan(Array.from(kecSet).sort());
                setAllDesa(Array.from(desaSet).sort());
                // mapping kecamatan -> desa[]
                const kecamatanToDesaObj: Record<string, string[]> = {};
                Object.entries(kecDesaMap).forEach(([kec, desas]) => {
                    kecamatanToDesaObj[kec] = Array.from(desas).sort();
                });
                setKecamatanToDesa(kecamatanToDesaObj);

                // Filter data sesuai kecamatan/desa
                let filtered = flat;
                if (selectedKecamatan) {
                    filtered = filtered.filter(f => f.kec === selectedKecamatan);
                }
                if (selectedDesa) {
                    filtered = filtered.filter(f => f.desa === selectedDesa);
                }

                // Tentukan label sesuai filter
                let yLabels: string[];
                if (selectedDesa) {
                    yLabels = filtered.map(f => f.desa);
                } else if (selectedKecamatan) {
                    yLabels = filtered.map(f => f.kec);
                } else {
                    yLabels = filtered.map(f => f.label);
                }

                // Urutkan dari terbesar
                filtered.sort((a, b) => b.value - a.value);
                setCategories(yLabels);
                setTotals(filtered.map(f => f.value));
                setFullLabels(filtered.map(f => f.label));
            })
            .catch(() => {
                setCategories([]);
                setTotals([]);
                setAllKecamatan([]);
                setAllDesa([]);
                setKecamatanToDesa({});
                setFullLabels([]);
            });
    }, [filter, year, month, week, selectedKecamatan, selectedDesa]);

    // Reset week ke-1 jika ganti bulan/tahun/filter
    useEffect(() => {
        setWeek(1);
    }, [month, year, filter]);

    // Reset filter desa jika kecamatan berubah
    useEffect(() => {
        setSelectedDesa("");
    }, [selectedKecamatan]);

    // Download CSV
    const handleDownloadCSV = () => {
        let csv = "Wilayah,Total\n";
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

    // Cek jika semua data 0 atau kosong
    const isAllZero = totals.length === 0 || totals.every((v) => v === 0);

    const chartOptions = {
        chart: {
            type: 'bar' as const,
            height: 400,
            toolbar: { show: false },
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
            title: { text: "Wilayah" },
            labels: { style: { fontSize: '12px' } }
        },
        colors: ['#0ea5e9'],
        grid: { borderColor: '#eee' },
        tooltip: {
            enabled: true,
            y: {
                formatter: function (val: number, opts: { dataPointIndex: number }) {
                    const idx = opts.dataPointIndex;
                    return `${fullLabels[idx] || ''}: ${val}`;
                }
            }
        },
        responsive: [{ breakpoint: 480, options: { chart: { height: 300 } } }],
    };

    const chartSeries = [{ name: 'Total Laporan', data: totals }];

    return (
        <div className="bg-white shadow-md rounded-xl p-6 w-full h-full">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-2">
                <h4 className="text-lg font-semibold text-gray-800 ">Penanganan Perangkat Daerah</h4>
                {/* Baris 1: Periode & Download (kanan) */}
                <div className="flex flex-wrap gap-2 items-center justify-end">
                    <select
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="border rounded px-2 py-1 text-sm text-black"
                    >
                        {FILTERS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="border rounded px-2 py-1 text-sm text-black"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    {(filter === "monthly" || filter === "weekly") && (
                        <select
                            value={month}
                            onChange={e => setMonth(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm text-black"
                        >
                            {months.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    )}
                    {filter === "weekly" && (
                        <select
                            value={week}
                            onChange={e => setWeek(Number(e.target.value))}
                            className="border rounded px-2 py-1 text-sm text-black"
                        >
                            {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w}>Minggu ke-{w}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={handleDownloadCSV}
                        className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600"
                        type="button"
                    >
                        Download CSV
                    </button>
                </div>
            </div>
            {/* Baris 2: Filter Kecamatan & Desa (kanan) */}
            <div className="flex flex-wrap gap-2 items-center mb-4 justify-end">
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
                <select
                    value={selectedDesa}
                    onChange={e => setSelectedDesa(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                >
                    <option value="">Semua Desa</option>
                    {(selectedKecamatan
                        ? (kecamatanToDesa[selectedKecamatan] || [])
                        : allDesa
                    ).map(desa => (
                        <option key={desa} value={desa}>{desa}</option>
                    ))}
                </select>
            </div>
            {isAllZero ? (
                <div className="flex items-center justify-center h-[400px] border border-dashed rounded-xl">
                    <div className="text-center">
                        <div className="text-amber-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Tidak ada data laporan
                        </h3>
                        <p className="text-gray-600">
                            Tidak ada data untuk periode yang dipilih
                        </p>
                    </div>
                </div>
            ) : (
                <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="bar"
                    width="100%"
                    height={400}
                />
            )}
        </div>
    );
}
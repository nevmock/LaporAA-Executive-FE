'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MoreVertical } from 'react-feather';
import { ApexOptions } from "apexcharts";
import axios from "axios";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const LineChart = () => {
    const [dates, setDates] = useState<string[]>([]);
    const [totals, setTotals] = useState<number[]>([]);

    useEffect(() => {
        axios.get(`${API_URL}/dashboard/harian`)
            .then((res) => {
                const data = res.data ?? [];
                const sorted = data.sort((a : any, b : any) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setDates(sorted.map((item: any) => item.date));
                setTotals(sorted.map((item: any) => item.total));
            })
            .catch((err) => {
                console.error("Gagal mengambil data laporan harian:", err);
                setDates([]);
                setTotals([]);
            });
    }, []);

    const chartOptions: ApexOptions = {
        chart: {
            type: 'line',
            height: 320,
            zoom: { enabled: false },
            toolbar: { show: false },
        },
        colors: ['#0ea5e9'],
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        markers: {
            size: 4,
            hover: { size: 6 },
        },
        xaxis: {
            categories: dates,
            title: { text: "Tanggal" },
            labels: {
                rotate: -45,
                style: { fontSize: '12px' }
            }
        },
        yaxis: {
            title: { text: "Total Laporan" },
        },
        dataLabels: {
            enabled: false,
        },
        legend: {
            show: false,
        },
        responsive: [
            {
                breakpoint: 480,
                options: { chart: { height: 300 } }
            },
        ],
    };

    const chartSeries = [
        {
            name: 'Laporan Masuk',
            data: totals
        }
    ];

    return (
        <div className="bg-white shadow-md rounded-xl p-6 w-full h-full">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">Laporan Masuk Harian</h4>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                </button>
            </div>

            <Chart
                options={chartOptions}
                series={chartSeries}
                type="line"
                width="100%"
            />
        </div>
    );
};

export default LineChart;
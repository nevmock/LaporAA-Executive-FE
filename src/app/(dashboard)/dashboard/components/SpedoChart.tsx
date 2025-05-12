'use client';
import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { MoreVertical } from 'react-feather';
import { ApexOptions } from "apexcharts";
import { formatWIBDate } from "../../../../utils/dateFormater";
import axios from "axios";

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const SpedoChart = () => {
    const [effectiveness, setEffectiveness] = useState({ value: 0, updated_at: "" });
    const [efisiensi, setEfisiensi] = useState({ value: 0, updated_at: "" });
    const [kepuasan, setKepuasan] = useState({ value: 0, updated_at: "" });
    const [distribusi, setDistribusi] = useState({ value: 0, updated_at: "" });

    useEffect(() => {
        axios.get(`${API_URL}/dashboard/effectiveness`)
            .then(res => setEffectiveness(res.data ?? { value: 0, updated_at: "" }))
            .catch(() => setEffectiveness({ value: 0, updated_at: "" }));

        axios.get(`${API_URL}/dashboard/efisiensi`)
            .then(res => setEfisiensi(res.data ?? { value: 0, updated_at: "" }))
            .catch(() => setEfisiensi({ value: 0, updated_at: "" }));

        axios.get(`${API_URL}/dashboard/kepuasan`)
            .then(res => setKepuasan(res.data ?? { value: 0, updated_at: "" }))
            .catch(() => setKepuasan({ value: 0, updated_at: "" }));

        axios.get(`${API_URL}/dashboard/distribusi`)
            .then(res => setDistribusi(res.data ?? { value: 0, updated_at: "" }))
            .catch(() => setDistribusi({ value: 0, updated_at: "" }));
    }, []);

    const chartSeries = [
        effectiveness.value,
        efisiensi.value,
        kepuasan.value,
        distribusi.value,
    ];

    const chartOptions: ApexOptions = {
        chart: { type: 'radialBar' },
        labels: ['Completed', 'In-Progress', 'Behind', 'Distribusi'],
        colors: ['#28a745', '#ffc107', '#dc3545', '#06b6d4'],
        stroke: { lineCap: 'round' },
        plotOptions: {
            radialBar: {
                startAngle: 0,
                endAngle: 360, // lingkaran penuh
                hollow: { size: '55%' },
                track: { background: 'transparent' },
                dataLabels: {
                    show: false,
                }
            }
        },
        legend: {
            show: false
        },
        responsive: [
            {
                breakpoint: 480,
                options: { chart: { height: 300 } }
            },
            {
                breakpoint: 5000,
                options: { chart: { height: 320 } }
            }
        ]
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6 w-full h-[600px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-800">Tasks Performance</h4>
                <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                </button>
            </div>

            {/* Chart */}
            <div className="mb-6">
                <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="radialBar"
                    width="100%"
                />
            </div>

            <div className="flex justify-center gap-6 mt-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600">Efectifeness</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-gray-600">Efisiensi</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-gray-600">Kepuasan Sosial</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-cyan-500 rounded-full"></span>
                    <span className="text-gray-600">Distribusi</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-800">
                <div className="text-center">
                    <i className="fe fe-check-circle text-green-500 text-2xl" />
                    <h1 className="mt-2 mb-1 text-2xl font-bold">{effectiveness.value.toFixed(2)}%</h1>
                    <p>Efectifeness</p>
                    <p className="text-xs italic text-gray-500 mt-1">Updated: {formatWIBDate(effectiveness.updated_at)}</p>
                </div>
                <div className="text-center">
                    <i className="fe fe-trending-up text-yellow-500 text-2xl" />
                    <h1 className="mt-2 mb-1 text-2xl font-bold">{efisiensi.value.toFixed(2)}%</h1>
                    <p>Efisiensi</p>
                    <p className="text-xs italic text-gray-500 mt-1">Updated: {formatWIBDate(efisiensi.updated_at)}</p>
                </div>
                <div className="text-center">
                    <i className="fe fe-trending-down text-red-500 text-2xl" />
                    <h1 className="mt-2 mb-1 text-2xl font-bold">{kepuasan.value.toFixed(2)}%</h1>
                    <p>Kepuasan Sosial</p>
                    <p className="text-xs italic text-gray-500 mt-1">Updated: {formatWIBDate(kepuasan.updated_at)}</p>
                </div>
                <div className="text-center">
                    <i className="fe fe-bar-chart text-cyan-600 text-2xl" />
                    <h1 className="mt-2 mb-1 text-2xl font-bold">{distribusi.value.toFixed(2)}</h1>
                    <p>Distribusi Solusi</p>
                    <p className="text-xs italic text-gray-500 mt-1">Updated: {formatWIBDate(distribusi.updated_at)}</p>
                </div>
            </div>
        </div>
    );
};

export default SpedoChart;

"use client";
import axios from "axios";
import Chart from 'chart.js/auto';
import { useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function EffectivenessChart() {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null); // agar tidak duplikat chart

    const DATA_COUNT = 12;
    const labels = Array.from({ length: DATA_COUNT }, (_, i) => i.toString());
    const datapoints = [0, 20, 20, 60, 60, 120, NaN, 180, 120, 125, 105, 110, 170];

    const data = {
        labels,
        datasets: [
            {
                label: 'Cubic interpolation (monotone)',
                data: datapoints,
                borderColor: 'red',
                fill: false,
                cubicInterpolationMode: 'monotone',
                tension: 0.4
            },
            {
                label: 'Cubic interpolation',
                data: datapoints,
                borderColor: 'blue',
                fill: false,
                tension: 0.4
            },
            {
                label: 'Linear interpolation (default)',
                data: datapoints,
                borderColor: 'green',
                fill: false
            }
        ]
    };

    const config = {
        type: 'line',
        data,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Chart.js Line Chart - Cubic interpolation mode'
                },
            },
            interaction: {
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Index'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Value'
                    },
                    suggestedMin: -10,
                    suggestedMax: 200
                }
            }
        }
    };

    useEffect(() => {
        const ctx = chartRef.current.getContext("2d");

        // Hapus chart sebelumnya jika ada
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new Chart(ctx, config);

        // Cleanup saat komponen unmount
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, []);

    return (
        <div className="w-full h-[400px]">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}
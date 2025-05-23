"use client";
import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface SummaryPieChartProps {
    statusCounts: Record<string, number>;
}

const SummaryPieChart: React.FC<SummaryPieChartProps> = ({ statusCounts }) => {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const chart = echarts.init(chartRef.current!);

        // Tetapkan urutan status tetap
        const orderedStatus = [
            "Perlu Verifikasi",
            "Verifikasi Situasi",
            "Verifikasi Kelengkapan Berkas",
            "Proses OPD Terkait",
            "Selesai Penanganan",
            "Selesai Pengaduan",
            "Ditolak",
        ];

        // Susun data sesuai urutan tetap
        const data = orderedStatus.map((status) => ({
            name: status,
            value: statusCounts[status] || 0,
        }));

        chart.setOption({
            color: [
                "#5470C6",
                "#91CC75",
                "#EE6666",
                "#FAC858",
                "#73C0DE",
                "#3BA272",
                "#FC8452",
            ],
            title: {
                text: "Distribusi Status",
                left: "center",
            },
            tooltip: {
                trigger: "item",
            },
            legend: {
                orient: "vertical",
                left: "left",
            },
            series: [
                {
                    name: "Status",
                    type: "pie",
                    radius: "60%",
                    data,
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

        const resize = () => chart.resize();
        window.addEventListener("resize", resize);
        return () => {
            chart.dispose();
            window.removeEventListener("resize", resize);
        };
    }, [statusCounts]);

    return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
};

export default SummaryPieChart;
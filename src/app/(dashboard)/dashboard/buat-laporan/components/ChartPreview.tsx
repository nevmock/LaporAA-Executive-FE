import React from 'react';
import ReactECharts from 'echarts-for-react';

interface ChartPreviewProps {
    chartType: "bar" | "pie" | "line";
    dataSource: "status" | "opd" | "situasi" | "summary";
    dashboardData: Record<string, number>;
    width: number;
    height: number;
}

const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c',
    '#8dd1e1', '#87d068', '#ffa940', '#fa541c'
];

export default function ChartPreview({ chartType, dataSource, dashboardData }: ChartPreviewProps) {
    const prepareData = () => {
        if (dataSource === "status") {
            return Object.entries(dashboardData).map(([status, count], index) => ({
                name: status.length > 15 ? status.substring(0, 15) + "..." : status,
                fullName: status,
                value: count,
                color: COLORS[index % COLORS.length]
            }));
        } else if (dataSource === "summary") {
            // Summary cards data
            const tindakLanjut = (dashboardData["Verifikasi Situasi"] || 0) + 
                               (dashboardData["Verifikasi Kelengkapan Berkas"] || 0) + 
                               (dashboardData["Proses OPD Terkait"] || 0);
            
            return [
                { name: "Tindak Lanjut", fullName: "Tindak Lanjut", value: tindakLanjut, color: COLORS[0] },
                { name: "Selesai Penanganan", fullName: "Selesai Penanganan", value: dashboardData["Selesai Penanganan"] || 0, color: COLORS[1] },
                { name: "Selesai Pengaduan", fullName: "Selesai Pengaduan", value: dashboardData["Selesai Pengaduan"] || 0, color: COLORS[2] },
                { name: "Ditutup", fullName: "Ditutup", value: dashboardData["Ditutup"] || 0, color: COLORS[3] }
            ];
        }
        
        // Default fallback
        return Object.entries(dashboardData).slice(0, 7).map(([key, value], index) => ({
            name: key.length > 15 ? key.substring(0, 15) + "..." : key,
            fullName: key,
            value: value,
            color: COLORS[index % COLORS.length]
        }));
    };

    const data = prepareData();

    if (data.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-gray-300">
                <div className="text-center text-gray-500">
                    <div className="text-sm">No data available</div>
                    <div className="text-xs mt-1">Data source: {dataSource}</div>
                </div>
            </div>
        );
    }

    const getChartOption = () => {
        const categories = data.map(item => item.name);
        const values = data.map(item => item.value);
        const colors = data.map(item => item.color);

        const baseOption = {
            tooltip: {
                trigger: 'item' as const,
                formatter: (params: { dataIndex: number; value: number }) => {
                    const dataItem = data[params.dataIndex];
                    return `${dataItem.fullName || dataItem.name}: ${params.value}`;
                }
            },
            color: colors,
            backgroundColor: 'transparent',
            grid: {
                top: 20,
                right: 20,
                bottom: 40,
                left: 40,
                containLabel: true
            }
        };

        if (chartType === 'bar') {
            return {
                ...baseOption,
                xAxis: {
                    type: 'category',
                    data: categories,
                    axisLabel: {
                        fontSize: 10,
                        rotate: -45,
                        interval: 0
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        fontSize: 10
                    }
                },
                series: [{
                    type: 'bar',
                    data: values,
                    itemStyle: {
                        color: (params: { dataIndex: number }) => colors[params.dataIndex] || COLORS[0]
                    }
                }]
            };
        }

        if (chartType === 'pie') {
            return {
                ...baseOption,
                tooltip: {
                    trigger: 'item' as const,
                    formatter: (params: { dataIndex: number; value: number; percent: number }) => {
                        const dataItem = data[params.dataIndex];
                        return `${dataItem.fullName || dataItem.name}: ${params.value} (${params.percent}%)`;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: ['0%', '70%'],
                    center: ['50%', '50%'],
                    data: data.map(item => ({
                        value: item.value,
                        name: item.name,
                        itemStyle: {
                            color: item.color
                        }
                    })),
                    label: {
                        show: true,
                        fontSize: 10,
                        formatter: '{b}: {c}'
                    },
                    labelLine: {
                        show: false
                    }
                }]
            };
        }

        if (chartType === 'line') {
            return {
                ...baseOption,
                xAxis: {
                    type: 'category',
                    data: categories,
                    axisLabel: {
                        fontSize: 10,
                        rotate: -45,
                        interval: 0
                    }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        fontSize: 10
                    }
                },
                series: [{
                    type: 'line',
                    data: values,
                    smooth: true,
                    lineStyle: {
                        color: COLORS[0],
                        width: 2
                    },
                    itemStyle: {
                        color: COLORS[0]
                    }
                }]
            };
        }

        return baseOption;
    };

    return (
        <div className="w-full h-full p-2">
            <ReactECharts
                option={getChartOption()}
                style={{ width: '100%', height: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
}

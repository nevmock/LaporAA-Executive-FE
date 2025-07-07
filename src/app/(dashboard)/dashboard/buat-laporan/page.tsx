"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    FiSave, 
    FiDownload, 
    FiTrash2, 
    FiType, 
    FiBarChart,
    FiPieChart
} from "react-icons/fi";
import axios from "../../../../utils/axiosInstance";
import dayjs from "dayjs";

// Template struktur laporan
const DEFAULT_TEMPLATE = {
    title: "LAPORAN STATISTIK PENGADUAN MASYARAKAT",
    subtitle: "Kabupaten Bekasi",
    period: "Bulanan",
    year: 2025,
    month: 7,
    elements: [
        {
            id: "header",
            type: "header" as const,
            content: "LAPORAN STATISTIK PENGADUAN MASYARAKAT",
            position: { x: 50, y: 50 },
            size: { width: 500, height: 60 },
            style: { fontSize: 24, fontWeight: "bold", textAlign: "center" }
        },
        {
            id: "subtitle",
            type: "text" as const, 
            content: "Kabupaten Bekasi",
            position: { x: 50, y: 120 },
            size: { width: 500, height: 30 },
            style: { fontSize: 18, textAlign: "center" }
        },
        {
            id: "period",
            type: "text" as const,
            content: "Periode: Juli 2025",
            position: { x: 50, y: 160 },
            size: { width: 500, height: 25 },
            style: { fontSize: 14, textAlign: "center" }
        }
    ]
};

interface ReportElement {
    id: string;
    type: "header" | "text" | "chart" | "table" | "image" | "summary-cards";
    content: string | object;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: {
        fontSize?: number;
        fontWeight?: string;
        textAlign?: string;
        [key: string]: unknown;
    };
    chartType?: "bar" | "pie" | "line";
    dataSource?: "status" | "opd" | "situasi" | "summary";
}

interface DashboardStats {
    current: Record<string, number>;
    trends: Record<string, unknown>;
}

export default function BuatLaporanPage() {
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
    const [elements, setElements] = useState<ReportElement[]>(DEFAULT_TEMPLATE.elements);
    const [selectedElement, setSelectedElement] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState<DashboardStats>({ current: {}, trends: {} });
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Fetch data dashboard untuk digunakan di laporan
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string | number> = { mode: "monthly", year: template.year };
            if (template.period === "Bulanan") {
                params.month = template.month;
            }
            
            const response = await axios.get("/dashboard/summary-dashboard", { params });
            setDashboardData(response.data);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [template.period, template.year, template.month]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const addElement = (type: ReportElement["type"]) => {
        const newElement: ReportElement = {
            id: `element_${Date.now()}`,
            type,
            content: type === "text" ? "Teks baru" : 
                    type === "header" ? "Judul Baru" :
                    type === "chart" ? "Chart Data" :
                    type === "summary-cards" ? "Summary Cards" :
                    "Konten baru",
            position: { x: 100, y: 200 + elements.length * 80 },
            size: { 
                width: type === "chart" ? 400 : type === "header" ? 500 : 300, 
                height: type === "chart" ? 300 : type === "header" ? 60 : 40 
            },
            style: {
                fontSize: type === "header" ? 20 : 14,
                fontWeight: type === "header" ? "bold" : "normal"
            }
        };

        if (type === "chart") {
            newElement.chartType = "bar";
            newElement.dataSource = "status";
        }

        setElements([...elements, newElement]);
    };

    const updateElement = (id: string, updates: Partial<ReportElement>) => {
        setElements(elements.map(el => 
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    const deleteElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id));
        setSelectedElement(null);
    };

    const generatePDF = async () => {
        try {
            setLoading(true);
            
            // Prepare report data
            const reportData = {
                template,
                elements,
                dashboardData,
                metadata: {
                    generatedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
                    generatedBy: localStorage.getItem("nama_admin") || "Admin"
                }
            };

            // Send to backend for PDF generation
            await axios.post("/reports/generate-pdf", reportData);

            // For now, show success message since we're not generating actual PDF yet
            alert("PDF generation endpoint ready! Full PDF functionality will be implemented with PDFKit.");
            
            // TODO: Uncomment when backend PDF generation is fully implemented
            /*
            // Download PDF
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Laporan-${template.title.replace(/\s+/g, '-')}-${dayjs().format('YYYY-MM-DD')}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            */

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Gagal membuat PDF. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const saveTemplate = async () => {
        try {
            setLoading(true);
            const templateData = {
                name: template.title,
                elements,
                settings: template
            };

            await axios.post("/reports/save-template", templateData);
            alert("Template berhasil disimpan!");
        } catch (error) {
            console.error("Error saving template:", error);
            alert("Gagal menyimpan template.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Buat Laporan</h1>
                        <p className="text-gray-600">Editor laporan dengan template yang dapat disesuaikan</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPreviewMode(!previewMode)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            {previewMode ? "Edit" : "Preview"}
                        </button>
                        <button
                            onClick={saveTemplate}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <FiSave size={16} />
                            Simpan Template
                        </button>
                        <button
                            onClick={generatePDF}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <FiDownload size={16} />
                            {loading ? "Membuat PDF..." : "Export PDF"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-80px)]">
                {/* Sidebar - Tools & Settings */}
                {!previewMode && (
                    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                        {/* Template Settings */}
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Pengaturan Laporan</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Judul Laporan
                                    </label>
                                    <input
                                        type="text"
                                        value={template.title}
                                        onChange={(e) => setTemplate({ ...template, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Periode
                                    </label>
                                    <select
                                        value={template.period}
                                        onChange={(e) => setTemplate({ ...template, period: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Bulanan">Bulanan</option>
                                        <option value="Tahunan">Tahunan</option>
                                        <option value="Mingguan">Mingguan</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tahun
                                        </label>
                                        <input
                                            type="number"
                                            value={template.year}
                                            onChange={(e) => setTemplate({ ...template, year: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    {template.period === "Bulanan" && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bulan
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={template.month}
                                                onChange={(e) => setTemplate({ ...template, month: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Add Elements */}
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Tambah Elemen</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => addElement("header")}
                                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
                                >
                                    <FiType size={20} />
                                    <span className="text-xs">Judul</span>
                                </button>
                                <button
                                    onClick={() => addElement("text")}
                                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
                                >
                                    <FiType size={20} />
                                    <span className="text-xs">Teks</span>
                                </button>
                                <button
                                    onClick={() => addElement("chart")}
                                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
                                >
                                    <FiBarChart size={20} />
                                    <span className="text-xs">Chart</span>
                                </button>
                                <button
                                    onClick={() => addElement("summary-cards")}
                                    className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
                                >
                                    <FiPieChart size={20} />
                                    <span className="text-xs">Summary</span>
                                </button>
                            </div>
                        </div>

                        {/* Element Properties */}
                        {selectedElement && (
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Properti Elemen</h3>
                                {(() => {
                                    const element = elements.find(el => el.id === selectedElement);
                                    if (!element) return null;

                                    return (
                                        <div className="space-y-3">
                                            {/* Content Editor */}
                                            {(element.type === "text" || element.type === "header") && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Konten
                                                    </label>
                                                    <textarea
                                                        value={element.content as string}
                                                        onChange={(e) => updateElement(element.id, { content: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                        rows={3}
                                                    />
                                                </div>
                                            )}

                                            {/* Chart Options */}
                                            {element.type === "chart" && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Tipe Chart
                                                        </label>
                                                        <select
                                                            value={element.chartType || "bar"}
                                                            onChange={(e) => updateElement(element.id, { chartType: e.target.value as ReportElement["chartType"] })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="bar">Bar Chart</option>
                                                            <option value="pie">Pie Chart</option>
                                                            <option value="line">Line Chart</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Sumber Data
                                                        </label>
                                                        <select
                                                            value={element.dataSource || "status"}
                                                            onChange={(e) => updateElement(element.id, { dataSource: e.target.value as ReportElement["dataSource"] })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="status">Status Laporan</option>
                                                            <option value="opd">Data OPD</option>
                                                            <option value="situasi">Data Situasi</option>
                                                            <option value="summary">Summary Cards</option>
                                                        </select>
                                                    </div>
                                                </>
                                            )}

                                            {/* Position & Size */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        X Position
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={element.position.x}
                                                        onChange={(e) => updateElement(element.id, { 
                                                            position: { ...element.position, x: parseInt(e.target.value) || 0 }
                                                        })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Y Position
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={element.position.y}
                                                        onChange={(e) => updateElement(element.id, { 
                                                            position: { ...element.position, y: parseInt(e.target.value) || 0 }
                                                        })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Width
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={element.size.width}
                                                        onChange={(e) => updateElement(element.id, { 
                                                            size: { ...element.size, width: parseInt(e.target.value) || 100 }
                                                        })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Height
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={element.size.height}
                                                        onChange={(e) => updateElement(element.id, { 
                                                            size: { ...element.size, height: parseInt(e.target.value) || 30 }
                                                        })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Font Size */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Font Size
                                                </label>
                                                <input
                                                    type="number"
                                                    value={element.style?.fontSize || 14}
                                                    onChange={(e) => updateElement(element.id, { 
                                                        style: { ...element.style, fontSize: parseInt(e.target.value) || 14 }
                                                    })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <button
                                                onClick={() => deleteElement(selectedElement)}
                                                className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FiTrash2 size={16} />
                                                Hapus Elemen
                                            </button>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                )}

                {/* Canvas - Report Preview */}
                <div className="flex-1 bg-gray-100 overflow-auto">
                    <div className="p-8">
                        <div className="bg-white shadow-lg mx-auto relative" style={{ width: "21cm", minHeight: "29.7cm", padding: "2cm" }}>
                            {/* Render elements */}
                            {elements.map((element) => (
                                <div
                                    key={element.id}
                                    className={`absolute border-2 ${
                                        selectedElement === element.id ? "border-blue-500 border-dashed" : "border-transparent hover:border-gray-300"
                                    } ${previewMode ? "cursor-default" : "cursor-move"}`}
                                    style={{
                                        left: element.position.x,
                                        top: element.position.y,
                                        width: element.size.width,
                                        height: element.size.height,
                                        fontSize: element.style?.fontSize || 14,
                                        fontWeight: element.style?.fontWeight || "normal",
                                        padding: "8px"
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!previewMode) setSelectedElement(element.id);
                                    }}
                                    onMouseDown={(e) => {
                                        if (previewMode) return;
                                        e.preventDefault();
                                        setSelectedElement(element.id);
                                        
                                        const startX = e.clientX - element.position.x;
                                        const startY = e.clientY - element.position.y;

                                        const handleMouseMove = (e: MouseEvent) => {
                                            const newX = e.clientX - startX;
                                            const newY = e.clientY - startY;
                                            updateElement(element.id, {
                                                position: { x: Math.max(0, newX), y: Math.max(0, newY) }
                                            });
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                >
                                    {/* Selection handles */}
                                    {selectedElement === element.id && !previewMode && (
                                        <>
                                            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nw-resize"></div>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-ne-resize"></div>
                                            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-sw-resize"></div>
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-se-resize"></div>
                                        </>
                                    )}

                                    {/* Element content */}
                                    {element.type === "header" && (
                                        <h1 className={`font-bold w-full h-full flex items-center overflow-hidden ${
                                            element.style?.textAlign === "center" ? "justify-center" : 
                                            element.style?.textAlign === "right" ? "justify-end" : "justify-start"
                                        }`}>
                                            {element.content as string}
                                        </h1>
                                    )}
                                    {element.type === "text" && (
                                        <p className={`w-full h-full flex items-start overflow-hidden ${
                                            element.style?.textAlign === "center" ? "justify-center text-center" : 
                                            element.style?.textAlign === "right" ? "justify-end text-right" : "justify-start text-left"
                                        }`}>
                                            {element.content as string}
                                        </p>
                                    )}
                                    {element.type === "chart" && (
                                        <div className="w-full h-full border border-gray-300 p-4 flex flex-col items-center justify-center bg-gray-50">
                                            <div className="text-sm text-gray-600 font-medium">
                                                📊 {element.chartType?.toUpperCase()} Chart
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Data: {element.dataSource}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2 text-center">
                                                Chart akan dirender saat export PDF
                                            </div>
                                        </div>
                                    )}
                                    {element.type === "summary-cards" && (
                                        <div className="w-full h-full border border-gray-300 p-3 bg-gray-50">
                                            <div className="text-sm font-medium mb-3 text-center">Summary Cards</div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="text-center p-2 bg-blue-100 rounded">
                                                    <div className="font-bold text-sm">
                                                        {dashboardData.current 
                                                            ? ((dashboardData.current["Verifikasi Situasi"] || 0) + 
                                                               (dashboardData.current["Verifikasi Kelengkapan Berkas"] || 0) + 
                                                               (dashboardData.current["Proses OPD Terkait"] || 0))
                                                            : "0"}
                                                    </div>
                                                    <div>Tindak Lanjut</div>
                                                </div>
                                                <div className="text-center p-2 bg-green-100 rounded">
                                                    <div className="font-bold text-sm">
                                                        {dashboardData.current?.["Selesai Pengaduan"] || 0}
                                                    </div>
                                                    <div>Selesai</div>
                                                </div>
                                                <div className="text-center p-2 bg-blue-100 rounded">
                                                    <div className="font-bold text-sm">
                                                        {dashboardData.current?.["Selesai Penanganan"] || 0}
                                                    </div>
                                                    <div>Penanganan</div>
                                                </div>
                                                <div className="text-center p-2 bg-red-100 rounded">
                                                    <div className="font-bold text-sm">
                                                        {dashboardData.current?.["Ditutup"] || 0}
                                                    </div>
                                                    <div>Ditutup</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {/* Click to deselect */}
                            <div 
                                className="absolute inset-0 -z-10"
                                onClick={() => setSelectedElement(null)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

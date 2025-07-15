"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiDownload } from "react-icons/fi";
import dayjs from "dayjs";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Import page components
import Page1Cover from "./components/Page1Cover";
import Page2Summary from "./components/Page2Summary";
import Page3Chart from "./components/Page3Chart";
import Page4Map from "./components/Page4Map";
import Page5Location from "./components/Page5Location";
import Page6Agency from "./components/Page6Agency";
import Page7Category from "./components/Page7Category";
import Page8Satisfaction from "./components/Page8Satisfaction";
import Page9Closing from "./components/Page9Closing";

// Template struktur laporan
const FIXED_TEMPLATE = {
    title: "LAPORAN STATISTIK PENGADUAN MASYARAKAT",
    subtitle: "Kabupaten Bekasi",
    period: "Bulanan",
    year: 2025,
    month: 7,
    coverData: {
        logoPath: '/LAPOR AA BUPATI.png',
        maskotPath: '/LAPOR AA BUPATI.png',
        dinasName: 'Diskominfosantik Kabupaten Bekasi',
        weekInfo: 'Minggu Ke-1 (2-8 Juni)'
    },
    summary: {
        totalReports: 583,
        resolvedReports: 492,
        averageResolutionDays: 5,
        pendingReports: 91,
        resolutionRate: 84
    }
};

interface ReportTemplate {
    title: string;
    subtitle: string;
    period: string;
    year: number;
    month: number;
    summary?: {
        totalReports: number;
        resolvedReports: number;
        averageResolutionDays: number;
        pendingReports: number;
        resolutionRate: number;
    };
}

export default function BuatLaporanPage() {
    const [template, setTemplate] = useState<ReportTemplate>(FIXED_TEMPLATE);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Refs untuk screenshot
    const coverPageRef = useRef<HTMLDivElement>(null);
    const summaryPageRef = useRef<HTMLDivElement>(null);
    const chartPageRef = useRef<HTMLDivElement>(null);
    const mapPageRef = useRef<HTMLDivElement>(null);
    const locationPageRef = useRef<HTMLDivElement>(null);
    const agencyPageRef = useRef<HTMLDivElement>(null);
    const categoryPageRef = useRef<HTMLDivElement>(null);
    const satisfactionPageRef = useRef<HTMLDivElement>(null);
    const closingPageRef = useRef<HTMLDivElement>(null);

    // Fungsi untuk generate nama file PDF
    const generatePdfFilename = () => {
        return `Laporan-LaporAA-${dayjs().format("YYYY-MM-DD-HHmmss")}.pdf`;
    };

    // Fungsi screenshot sederhana
    const captureElement = async (element: HTMLElement | null): Promise<string | null> => {
        if (!element) return null;
        
        try {
            // Tambahkan CSS khusus untuk screenshot
            const screenshotStyles = document.createElement('style');
            screenshotStyles.textContent = `
                .report-page-wrapper {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            `;
            document.head.appendChild(screenshotStyles);

            const canvas = await html2canvas(element, {
                scale: 1,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true,
                width: 1200,
                height: 675,
            });
            
            // Hapus CSS setelah screenshot
            document.head.removeChild(screenshotStyles);
            
            return canvas.toDataURL('image/png', 1.0);
        } catch (error) {
            console.error("Error capturing element:", error);
            return null;
        }
    };

    // Fungsi untuk membuat PDF
    const createPdfFromScreenshots = async () => {
        setLoading(true);
        setLoadingProgress(0);
        setLoadingMessage('Memulai proses export PDF...');

        try {
            let pdf: jsPDF | null = null;
            
            const pageRefs = [
                { ref: coverPageRef.current, name: 'Cover' },
                { ref: summaryPageRef.current, name: 'Summary' },
                { ref: chartPageRef.current, name: 'Chart' },
                { ref: mapPageRef.current, name: 'Map' },
                { ref: locationPageRef.current, name: 'Location' },
                { ref: agencyPageRef.current, name: 'Agency' },
                { ref: categoryPageRef.current, name: 'Category' },
                { ref: satisfactionPageRef.current, name: 'Satisfaction' },
                { ref: closingPageRef.current, name: 'Closing' }
            ];

            const totalPages = pageRefs.length;

            for (let i = 0; i < pageRefs.length; i++) {
                const { ref: pageRef, name } = pageRefs[i];
                if (!pageRef) continue;

                setLoadingMessage(`Mengambil screenshot halaman ${i + 1} (${name})...`);
                
                const screenshot = await captureElement(pageRef);
                if (!screenshot) continue;

                setLoadingMessage(`Menambahkan halaman ${i + 1} ke PDF...`);

                if (i === 0) {
                    const img = new Image();
                    img.src = screenshot;
                    await new Promise((resolve) => { img.onload = resolve; });

                    const pdfWidth = (img.width / 2) * 0.264583;
                    const pdfHeight = (img.height / 2) * 0.264583;

                    pdf = new jsPDF({
                        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
                        unit: 'mm',
                        format: [pdfWidth, pdfHeight]
                    });

                    pdf.addImage(screenshot, 'PNG', 0, 0, pdfWidth, pdfHeight);
                } else {
                    if (pdf) {
                        pdf.addPage();
                        const img = new Image();
                        img.src = screenshot;
                        await new Promise((resolve) => { img.onload = resolve; });

                        const pdfWidth = (img.width / 2) * 0.264583;
                        const pdfHeight = (img.height / 2) * 0.264583;

                        pdf.addImage(screenshot, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    }
                }

                const progress = Math.round(((i + 1) / totalPages) * 90);
                setLoadingProgress(progress);
            }

            if (!pdf) {
                throw new Error('No PDF created');
            }

            setLoadingMessage('Menyimpan PDF...');
            setLoadingProgress(95);

            const filename = generatePdfFilename();
            pdf.save(filename);

            setLoadingProgress(100);
            setLoadingMessage('PDF berhasil dibuat!');

            setTimeout(() => {
                setLoadingProgress(0);
                setLoadingMessage('');
            }, 1000);

        } catch (error) {
            console.error("Error creating PDF:", error);
            setLoadingMessage('Gagal membuat PDF');
            setLoadingProgress(0);
            alert("Gagal membuat PDF. Silakan coba lagi.");
        } finally {
            setTimeout(() => {
                setLoading(false);
                setLoadingProgress(0);
                setLoadingMessage('');
            }, 1000);
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
                        {/* Export PDF button */}
                        <button
                            disabled={loading}
                            onClick={createPdfFromScreenshots}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <FiDownload size={16} />
                            <span>
                                {loading ? `${loadingProgress}%` : "Export PDF"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading Progress Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="text-lg font-semibold mb-4">Membuat PDF</div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                <div 
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${loadingProgress}%` }}
                                ></div>
                            </div>
                            <div className="text-sm text-gray-600">
                                {loadingMessage}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                                {loadingProgress}% selesai
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-[calc(100vh-80px)]">
                {/* Sidebar - Settings */}
                <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                    {/* Report Settings */}
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Pengaturan Laporan</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Periode
                                </label>
                                <select
                                    value={template.period}
                                    onChange={(e) => setTemplate({ ...template, period: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Report Preview Info */}
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Informasi Laporan</h3>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Format:</span>
                                <span className="font-medium">Custom PDF</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Periode:</span>
                                <span className="font-medium">
                                    {template.period === "Bulanan"
                                        ? `${template.month}/${template.year}`
                                        : template.year}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Halaman:</span>
                                <span className="font-medium">9 halaman</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Engine:</span>
                                <span className="font-medium">html2canvas</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas - Content Area */}
                <div className="flex-1 bg-gray-100 overflow-auto">
                    <div className="py-4">
                        {/* Pages */}
                        <div ref={coverPageRef} className="mb-6">
                            <Page1Cover />
                        </div>
                        <div ref={summaryPageRef} className="mb-6">
                            <Page2Summary />
                        </div>
                        <div ref={chartPageRef} className="mb-6">
                            <Page3Chart />
                        </div>
                        <div ref={mapPageRef} className="mb-6">
                            <Page4Map />
                        </div>
                        <div ref={locationPageRef} className="mb-6">
                            <Page5Location />
                        </div>
                        <div ref={agencyPageRef} className="mb-6">
                            <Page6Agency />
                        </div>
                        <div ref={categoryPageRef} className="mb-6">
                            <Page7Category />
                        </div>
                        <div ref={satisfactionPageRef} className="mb-6">
                            <Page8Satisfaction />
                        </div>
                        <div ref={closingPageRef} className="mb-6">
                            <Page9Closing />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import React, { useState, useRef } from "react";
import { FiDownload } from "react-icons/fi";
import dayjs from "dayjs";
import 'dayjs/locale/id'; // Import locale Indonesia
import customParseFormat from 'dayjs/plugin/customParseFormat';
// Import react-to-print for PDF export
import { useReactToPrint } from "react-to-print";

// Import types
import { ReportTemplate } from './types/ReportTemplate';

// Setup dayjs
dayjs.locale('id'); // Set default locale ke Indonesia
dayjs.extend(customParseFormat);

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
    period: "Custom", // Default ke Custom untuk date range
    year: 2025,
    month: 7,
    // Default date range - 30 hari terakhir
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    // Tanggal dan waktu pembuatan laporan
    reportGeneratedAt: dayjs().format('DD MMMM YYYY | HH.mm [WIB]'),
    reportGeneratedDateTime: dayjs(),
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

// Page configuration untuk export selection
const PAGE_CONFIG = [
    { id: 'cover', label: 'Halaman Cover', component: 'Page1Cover', required: true },
    { id: 'summary', label: 'Ringkasan Statistik', component: 'Page2Summary', required: false },
    { id: 'chart', label: 'Grafik Trend', component: 'Page3Chart', required: false },
    { id: 'map', label: 'Peta Sebaran', component: 'Page4Map', required: false },
    { id: 'location', label: 'Statistik Lokasi', component: 'Page5Location', required: false },
    { id: 'agency', label: 'Statistik OPD', component: 'Page6Agency', required: false },
    { id: 'category', label: 'Statistik Kategori', component: 'Page7Category', required: false },
    { id: 'satisfaction', label: 'Tingkat Kepuasan', component: 'Page8Satisfaction', required: false },
    { id: 'closing', label: 'Halaman Penutup', component: 'Page9Closing', required: true },
];

export default function BuatLaporanPage() {
    const [template, setTemplate] = useState<ReportTemplate>(FIXED_TEMPLATE);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');
    
    // State untuk track halaman yang akan dieksport
    const [selectedPages, setSelectedPages] = useState<Set<string>>(
        new Set(['cover', 'summary', 'chart', 'map', 'location', 'agency', 'category', 'satisfaction', 'closing'])
    );

    // Helper function untuk toggle page selection
    const togglePageSelection = (pageId: string) => {
        const config = PAGE_CONFIG.find(p => p.id === pageId);
        if (config?.required) return; // Tidak bisa uncheck required pages
        
        setSelectedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
            } else {
                newSet.add(pageId);
            }
            return newSet;
        });
    };

    // Helper function untuk check if page is selected
    const isPageSelected = (pageId: string) => selectedPages.has(pageId);

    // Helper function untuk get selected pages count
    const getSelectedPagesCount = () => selectedPages.size;

    // Helper functions untuk select/deselect all
    const selectAllPages = () => {
        setSelectedPages(new Set(PAGE_CONFIG.map(p => p.id)));
    };

    const deselectAllOptionalPages = () => {
        const requiredPages = PAGE_CONFIG.filter(p => p.required).map(p => p.id);
        setSelectedPages(new Set(requiredPages));
    };

    // Helper functions untuk date range
    const handleDateRangeChange = (startDate: string, endDate: string) => {
        setTemplate(prev => ({
            ...prev,
            startDate,
            endDate,
            period: 'Custom' // Always Custom since we removed presets
        }));
    };

    // Helper function untuk format display periode berdasarkan range tanggal
    const getDisplayPeriod = () => {
        const start = dayjs(template.startDate);
        const end = dayjs(template.endDate);
        const startFormat = start.format('DD MMMM YYYY');
        const endFormat = end.format('DD MMMM YYYY');
        
        // Jika tanggal sama, tampilkan hanya satu tanggal
        if (start.isSame(end, 'day')) {
            return startFormat;
        }
        
        // Jika bulan dan tahun sama, singkat format awal
        if (start.isSame(end, 'month')) {
            return `${start.format('DD')} - ${endFormat}`;
        }
        
        // Jika tahun sama, singkat format awal
        if (start.isSame(end, 'year')) {
            return `${start.format('DD MMMM')} - ${endFormat}`;
        }
        
        // Format lengkap jika beda tahun
        return `${startFormat} - ${endFormat}`;
    };

    // Helper function untuk menghitung durasi laporan
    const getReportDuration = () => {
        const start = dayjs(template.startDate);
        const end = dayjs(template.endDate);
        const days = end.diff(start, 'days') + 1; // +1 untuk include end date
        
        if (days === 1) return '1 hari';
        if (days <= 7) return `${days} hari`;
        if (days <= 30) return `${days} hari`;
        if (days <= 365) return `${Math.round(days / 30)} bulan`;
        return `${Math.round(days / 365)} tahun`;
    };

    // Validation untuk date range
    const isValidDateRange = () => {
        const start = dayjs(template.startDate);
        const end = dayjs(template.endDate);
        const today = dayjs();
        
        // Start date tidak boleh lebih dari end date
        if (start.isAfter(end)) return false;
        
        // End date tidak boleh lebih dari hari ini
        if (end.isAfter(today)) return false;
        
        // Maksimal range 2 tahun
        const maxDays = 730; // 2 tahun
        if (end.diff(start, 'days') > maxDays) return false;
        
        return true;
    };

    // Get validation message
    const getDateValidationMessage = () => {
        const start = dayjs(template.startDate);
        const end = dayjs(template.endDate);
        const today = dayjs();
        
        if (start.isAfter(end)) {
            return 'Tanggal mulai tidak boleh lebih dari tanggal akhir';
        }
        
        if (end.isAfter(today)) {
            return 'Tanggal akhir tidak boleh lebih dari hari ini';
        }
        
        if (end.diff(start, 'days') > 730) {
            return 'Rentang tanggal maksimal 2 tahun';
        }
        
        return '';
    };

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

    // Ref untuk print content
    const printRef = useRef<HTMLDivElement>(null);

    // Fungsi untuk generate PDF menggunakan react-to-print
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Laporan-LaporAA-${dayjs().format("YYYY-MM-DD-HHmmss")}`,
        onAfterPrint: () => {
            setLoading(false);
            setLoadingMessage('PDF berhasil dibuat!');
            setTimeout(() => setLoadingMessage(''), 2000);
        },
        pageStyle: `
            @page {
                size: 1200px 675px;
                margin: 0;
                orientation: landscape;
            }
            
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    margin: 0;
                    padding: 0;
                }
                
                .report-page-wrapper {
                    page-break-after: always;
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 1200px !important;
                    height: 675px !important;
                    background: white !important;
                    display: block !important;
                    box-sizing: border-box !important;
                }
                
                .report-page-wrapper:last-child {
                    page-break-after: avoid;
                }
                
                /* Preserve transform rotation for print */
                [style*="rotate(-90deg)"] {
                    transform: translateX(-50%) rotate(-90deg) !important;
                }
                
                /* Force all transform styles to be preserved */
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    box-sizing: border-box !important;
                }
                
                /* Remove any extra spacing */
                div[ref] {
                    margin: 0 !important;
                    padding: 0 !important;
                }
            }
        `
    });

    // Fungsi wrapper untuk print
    const createPdfFromScreenshots = async () => {
        setLoading(true);
        setLoadingProgress(0);
        setLoadingMessage('Mempersiapkan dokumen untuk PDF...');
        
        try {
            // Note: Tanggal tidak diupdate otomatis lagi, 
            // user bisa mengatur manual di pengaturan laporan
            
            setLoadingProgress(50);
            setLoadingMessage('Membuat PDF...');
            handlePrint();
            setLoadingProgress(100);
            setLoadingMessage('PDF berhasil dibuat!');
        } catch (error) {
            console.error("Error generating PDF:", error);
            setLoadingMessage("Error saat membuat PDF. Silakan coba lagi.");
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
        <div className="h-screen bg-gray-50">
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

            <div className="flex h-screen">
                {/* Sidebar - Settings */}
                <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
                    {/* Export PDF Button - Paling Atas */}
                    <div className="p-4 border-b border-gray-200">
                        <button
                            disabled={loading || !isValidDateRange() || getSelectedPagesCount() === 0}
                            onClick={createPdfFromScreenshots}
                            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                        >
                            <FiDownload size={18} />
                            <span>
                                {loading ? `${loadingProgress}%` : "Export PDF"}
                            </span>
                        </button>
                    </div>

                    {/* Report Settings */}
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900 mb-3">Pengaturan Laporan</h3>
                        <div className="space-y-3">
                            {/* Date Range Picker */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Rentang Tanggal Laporan
                                </label>
                                
                                {/* Start Date */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Dari Tanggal</label>
                                    <input
                                        type="date"
                                        value={template.startDate}
                                        onChange={(e) => handleDateRangeChange(e.target.value, template.endDate)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    />
                                </div>
                                
                                {/* End Date */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Sampai Tanggal</label>
                                    <input
                                        type="date"
                                        value={template.endDate}
                                        onChange={(e) => handleDateRangeChange(template.startDate, e.target.value)}
                                        min={template.startDate} // End date tidak boleh lebih kecil dari start date
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    />
                                </div>
                                
                                {/* Date Range Preview */}
                                <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded border">
                                    Periode: {getDisplayPeriod()}
                                </div>
                                
                                {/* Date Range Summary */}
                                <div className="text-xs text-gray-500">
                                    Durasi: {getReportDuration()}
                                </div>
                                
                                {/* Validation Message */}
                                {!isValidDateRange() && (
                                    <div className="text-xs text-red-500 mt-1">
                                        ⚠️ {getDateValidationMessage()}
                                    </div>
                                )}
                                
                                {isValidDateRange() && (
                                    <div className="text-xs text-green-600 mt-1">
                                        ✓ Rentang tanggal valid
                                    </div>
                                )}
                            </div>

                            {/* Report Generation Date Setting */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tanggal Pembuatan Laporan
                                </label>
                                <div className="space-y-2">
                                    {/* Current Date Preview */}
                                    <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded border">
                                        Saat ini: {template.reportGeneratedAt}
                                    </div>
                                    
                                    {/* Date Input untuk Custom Date */}
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Atur Tanggal Manual</label>
                                        <input
                                            type="datetime-local"
                                            value={template.reportGeneratedDateTime.format('YYYY-MM-DDTHH:mm')}
                                            onChange={(e) => {
                                                const newDateTime = dayjs(e.target.value);
                                                setTemplate(prev => ({
                                                    ...prev,
                                                    reportGeneratedDateTime: newDateTime,
                                                    reportGeneratedAt: newDateTime.format('DD MMMM YYYY | HH.mm [WIB]')
                                                }));
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        />
                                    </div>
                                    
                                    {/* Quick Reset Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = dayjs();
                                            setTemplate(prev => ({
                                                ...prev,
                                                reportGeneratedDateTime: now,
                                                reportGeneratedAt: now.format('DD MMMM YYYY | HH.mm [WIB]')
                                            }));
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        Reset ke Waktu Sekarang
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Page Selection */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-900">Pilih Halaman untuk Export</h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={selectAllPages}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Pilih Semua
                                </button>
                                <span className="text-xs text-gray-400">|</span>
                                <button
                                    onClick={deselectAllOptionalPages}
                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {PAGE_CONFIG.map((page) => (
                                <label key={page.id} className="flex items-center space-x-3 cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={isPageSelected(page.id)}
                                            onChange={() => togglePageSelection(page.id)}
                                            disabled={page.required}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <span className={`text-sm font-medium ${
                                            isPageSelected(page.id) ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                            {page.label}
                                        </span>
                                        {page.required && (
                                            <span className="text-xs text-blue-600 ml-1">(Wajib)</span>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                        
                        {/* Selection Summary */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500">
                                {getSelectedPagesCount()} dari {PAGE_CONFIG.length} halaman dipilih
                            </div>
                            {getSelectedPagesCount() === 0 && (
                                <div className="text-xs text-red-500 mt-1">
                                    ⚠️ Pilih minimal 1 halaman untuk export
                                </div>
                            )}
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
                                    {getDisplayPeriod()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Durasi:</span>
                                <span className="font-medium">{getReportDuration()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Halaman:</span>
                                <span className="font-medium">{getSelectedPagesCount()} halaman dipilih</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tanggal Laporan:</span>
                                <span className="font-medium text-xs">{template.reportGeneratedAt}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Engine:</span>
                                <span className="font-medium">react-to-print</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Canvas - Content Area */}
                <div className="flex-1 bg-gray-100 overflow-auto">
                    <div ref={printRef} className="py-0">
                        {/* Pages - Conditionally rendered based on selection */}
                        {isPageSelected('cover') && (
                            <div ref={coverPageRef} className="mb-0">
                                <Page1Cover template={template} />
                            </div>
                        )}
                        {isPageSelected('summary') && (
                            <div ref={summaryPageRef} className="mb-0">
                                <Page2Summary template={template} />
                            </div>
                        )}
                        {isPageSelected('chart') && (
                            <div ref={chartPageRef} className="mb-0">
                                <Page3Chart template={template} />
                            </div>
                        )}
                        {isPageSelected('map') && (
                            <div ref={mapPageRef} className="mb-0">
                                <Page4Map template={template} />
                            </div>
                        )}
                        {isPageSelected('location') && (
                            <div ref={locationPageRef} className="mb-0">
                                <Page5Location template={template} />
                            </div>
                        )}
                        {isPageSelected('agency') && (
                            <div ref={agencyPageRef} className="mb-0">
                                <Page6Agency template={template} />
                            </div>
                        )}
                        {isPageSelected('category') && (
                            <div ref={categoryPageRef} className="mb-0">
                                <Page7Category template={template} />
                            </div>
                        )}
                        {isPageSelected('satisfaction') && (
                            <div ref={satisfactionPageRef} className="mb-0">
                                <Page8Satisfaction template={template} />
                            </div>
                        )}
                        {isPageSelected('closing') && (
                            <div ref={closingPageRef} className="mb-0">
                                <Page9Closing template={template} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

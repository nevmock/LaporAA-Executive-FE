'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ModernChartCard, FilterControls } from '../modern';
import { useAvailablePeriods } from '../../../hooks/useAvailablePeriods';

// Dynamic import untuk LiveMapUpdates dengan ssr: false
const LiveMapUpdates = dynamic(() => import('../widgets/LiveMapUpdates'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 animate-pulse">
                <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm">Memuat peta...</span>
            </div>
        </div>
    ),
});

export default function MapPersebaranCard() {
    // Filter states
    const [timeFilter, setTimeFilter] = useState('monthly');
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [week, setWeek] = useState(1);
    
    // Map-specific filter states
    const [selectedStatus, setSelectedStatus] = useState('Semua Status');
    const [selectedKecamatan, setSelectedKecamatan] = useState('Semua Kecamatan');
    const [limitView, setLimitView] = useState(100);
    const [showBoundaries, setShowBoundaries] = useState(true);
    const [boundariesLoading, setBoundariesLoading] = useState(false);

    // Gunakan hook untuk mendapatkan periode yang memiliki data
    const {
        getAvailableMonthOptions,
        getAllYearOptions,
        getDefaultMonth,
        getDefaultYear,
        hasDataForMonth,
        loading: periodsLoading
    } = useAvailablePeriods(year);

    // Set default values berdasarkan data yang tersedia
    useEffect(() => {
        if (!periodsLoading) {
            // Set default month ke bulan yang memiliki data (jika filter monthly/weekly)
            if ((timeFilter === 'monthly' || timeFilter === 'weekly') && !hasDataForMonth(month)) {
                const defaultMonth = getDefaultMonth();
                if (defaultMonth !== month) {
                    setMonth(defaultMonth);
                }
            }
            
            // Set default year jika tahun saat ini tidak memiliki data
            const defaultYear = getDefaultYear();
            if (defaultYear !== year) {
                setYear(defaultYear);
            }
        }
    }, [periodsLoading, timeFilter, hasDataForMonth, month, getDefaultMonth, getDefaultYear, year]);

    // Filter options
    const timeFilterOptions = [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
    ];

    // Status options for map
    const statusOptions = [
        'Semua Status',
        'Perlu Verifikasi',
        'Verifikasi Situasi', 
        'Verifikasi Kelengkapan Berkas',
        'Proses OPD Terkait',
        'Selesai Penanganan',
        'Selesai Pengaduan',
        'Ditutup'
    ];

    // Location options (kecamatan list - could be fetched from API)
    const kecamatanOptions = [
        'Semua Kecamatan',
        'Bekasi Utara',
        'Bekasi Timur', 
        'Bekasi Selatan',
        'Bekasi Barat',
        // Add more as needed
    ];

    const getWeeksInMonth = (year: number, month: number) => {
        const date = new Date(year, month - 1, 1);
        const weeks = [];
        let week = 1;
        while (date.getMonth() === month - 1) {
            weeks.push(week);
            date.setDate(date.getDate() + 7);
            week++;
        }
        return weeks;
    };

    const weekOptions = getWeeksInMonth(year, month);

    // Handle info modal
    const handleInfo = () => {
        alert('Peta ini menampilkan persebaran geografis laporan pengaduan. Marker menunjukkan lokasi kejadian dengan warna berbeda berdasarkan status laporan. Zoom dan pan untuk melihat area tertentu.');
    };

    // Handle export CSV
    const handleDownloadCSV = () => {
        // Export map data to CSV - this would need to be implemented based on map data
        alert('Export peta akan segera tersedia. Untuk saat ini, gunakan screenshot atau fitur print browser.');
    };

    // Note: handleRefresh function removed as it was unused

    // Filter component with all map-specific filters
    const filterControls = (
        <FilterControls
            filters={{
                timeFilter: {
                    value: timeFilter,
                    onChange: setTimeFilter,
                    options: timeFilterOptions
                },
                year: {
                    value: year,
                    onChange: setYear,
                    options: getAllYearOptions()
                },
                month: {
                    value: month,
                    onChange: setMonth,
                    options: getAvailableMonthOptions(),
                    show: timeFilter === 'monthly' || timeFilter === 'weekly'
                },
                week: {
                    value: week,
                    onChange: setWeek,
                    options: weekOptions,
                    show: timeFilter === 'weekly'
                },
                status: {
                    value: selectedStatus,
                    onChange: setSelectedStatus,
                    options: statusOptions
                },
                location: {
                    value: selectedKecamatan,
                    onChange: setSelectedKecamatan,
                    options: kecamatanOptions,
                    placeholder: 'Pilih Kecamatan'
                },
                limitView: {
                    value: limitView,
                    onChange: setLimitView,
                    options: [100, 200, 300, 400, 500],
                    label: 'Tampilkan'
                },
                boundaries: {
                    value: showBoundaries,
                    onChange: setShowBoundaries,
                    label: 'Tampilkan Wilayah',
                    loading: boundariesLoading
                }
            }}
        />
    );

    return (
        <ModernChartCard
            title="Peta Persebaran Laporan"
            subtitle="Visualisasi geografis persebaran laporan pengaduan"
            chartType="bar" // Using bar as placeholder since map is not in chartType options
            option={{}} // Empty option since this isn't a chart
            loading={false}
            error={null}
            color="green"
            onDownload={handleDownloadCSV}
            onInfo={handleInfo}
            showRefresh={false}
            showDownload={true}
            showFullscreen={true}
            showInfo={true}
            height={500}
            className="h-full"
            filters={filterControls}
            useInternalFullscreen={true}
        >
            {/* Custom content - map instead of chart */}
            <div className="w-full h-full">
                <LiveMapUpdates 
                    className="w-full h-full"
                    timeFilter={timeFilter}
                    year={year}
                    month={month}
                    week={week}
                    selectedStatus={selectedStatus}
                    selectedKecamatan={selectedKecamatan}
                    limitView={limitView}
                    showBoundaries={showBoundaries}
                    setBoundariesLoading={setBoundariesLoading}
                />
            </div>
        </ModernChartCard>
    );
}

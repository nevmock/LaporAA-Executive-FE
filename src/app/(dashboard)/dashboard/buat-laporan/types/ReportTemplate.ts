import dayjs, { Dayjs } from 'dayjs';

export interface ReportTemplate {
    title: string;
    subtitle: string;
    period: string;
    year: number;
    month: number;
    // Date range untuk laporan
    startDate: string;  // Format: YYYY-MM-DD
    endDate: string;    // Format: YYYY-MM-DD
    // Tanggal dan waktu pembuatan laporan
    reportGeneratedAt: string;  // Format: DD MMMM YYYY | HH.mm WIB
    reportGeneratedDateTime: Dayjs;
    coverData?: {
        logoPath: string;
        maskotPath: string;
        dinasName: string;
        weekInfo: string;
    };
    summary?: {
        totalReports: number;
        resolvedReports: number;
        averageResolutionDays: number;
        pendingReports: number;
        resolutionRate: number;
    };
}

// Helper function untuk menggenerate periode dinamis
export const generatePeriodDescription = (startDate: string, endDate: string): {
    periodType: string;
    periodDescription: string;
    weekInfo: string;
} => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diffDays = end.diff(start, 'days') + 1; // +1 untuk include end date
    
    let periodType = '';
    let periodDescription = '';
    let weekInfo = '';
    
    if (diffDays === 1) {
        // Harian
        periodType = 'Periode Harian';
        periodDescription = start.format('DD MMMM YYYY');
        weekInfo = `Hari: ${start.format('dddd, DD MMMM YYYY')}`;
    } else if (diffDays <= 7) {
        // Mingguan
        periodType = 'Periode Mingguan';
        if (start.isSame(end, 'month')) {
            periodDescription = `${start.format('DD')}-${end.format('DD')} ${end.format('MMMM YYYY')}`;
        } else {
            periodDescription = `${start.format('DD MMMM')} - ${end.format('DD MMMM YYYY')}`;
        }
        weekInfo = `${diffDays} hari (${start.format('DD/MM')} - ${end.format('DD/MM/YYYY')})`;
    } else if (diffDays <= 31) {
        // Bulanan atau Per-Bulan
        if (start.isSame(end, 'month')) {
            periodType = `Periode ${start.format('MMMM YYYY')}`;
            periodDescription = `${start.format('DD')}-${end.format('DD')} ${end.format('MMMM YYYY')}`;
        } else {
            periodType = 'Periode Bulanan';
            periodDescription = `${start.format('DD MMMM')} - ${end.format('DD MMMM YYYY')}`;
        }
        weekInfo = `${diffDays} hari`;
    } else if (diffDays <= 366) {
        // Tahunan atau Per-Tahun
        if (start.isSame(end, 'year')) {
            periodType = `Periode Tahun ${start.format('YYYY')}`;
            periodDescription = `${start.format('DD MMMM')} - ${end.format('DD MMMM YYYY')}`;
        } else {
            periodType = 'Periode Multi-Tahun';
            periodDescription = `${start.format('DD MMMM YYYY')} - ${end.format('DD MMMM YYYY')}`;
        }
        weekInfo = `${Math.round(diffDays/30)} bulan (${diffDays} hari)`;
    } else {
        // Custom range panjang
        periodType = 'Periode Custom';
        periodDescription = `${start.format('DD MMMM YYYY')} - ${end.format('DD MMMM YYYY')}`;
        weekInfo = `${Math.round(diffDays/365)} tahun (${diffDays} hari)`;
    }
    
    return {
        periodType,
        periodDescription,
        weekInfo
    };
};

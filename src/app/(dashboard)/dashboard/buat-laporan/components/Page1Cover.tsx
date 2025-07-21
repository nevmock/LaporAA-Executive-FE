import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';
import { ReportTemplate, generatePeriodDescription } from '../types/ReportTemplate';

const LOGO_SRC = '/kab-bekasi1.png';   // path logo Bekasi
const MASKOT_SRC = '/LAPOR AA BUPATI.png';      // path foto bupati PNG (tanpa badge)

interface Page1CoverProps {
    template?: ReportTemplate;
}

const Page1Cover: React.FC<Page1CoverProps> = ({ template }) => {
    // Fallback untuk tanggal jika template tidak tersedia
    const displayDate = template?.reportGeneratedAt || '25 Juni 2025 | 15.00 WIB';
    
    // Generate periode dinamis
    const periodInfo = template ? 
        generatePeriodDescription(template.startDate, template.endDate) : 
        {
            periodType: 'Periode Mingguan',
            periodDescription: 'Minggu Ke-1 (2-8 Juni)',
            weekInfo: 'Juni Tahun 2025'
        };
    
    return (
        <ReportPageWrapper template={template}>

        {/* Wrapper for main content, 2 columns */}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            marginLeft: '0px',        // Hilangkan margin kiri
            marginRight: '0px',       // Hilangkan margin kanan juga
            marginBottom: '0px',      // Hilangkan margin bottom
            marginTop: '0px',         // Hilangkan margin top
            paddingLeft: '20px',      // Gunakan padding sebagai gantinya
            paddingRight: '20px',     // Padding kanan
            paddingTop: '20px',       // Padding atas minimal
            position: 'relative',
        }}>
            {/* Kiri: Tulisan */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                {/* Header Logo + Dinas */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: '30px',
                    }}
                >
                    <img
                        src={LOGO_SRC}
                        alt="Logo Bekasi"
                        style={{
                            width: '52px',
                            height: '54px',
                            objectFit: 'contain',
                            marginRight: '18px',
                        }}
                    />
                    <span
                        style={{
                            fontSize: '28px',
                            fontWeight: 400,
                            color: '#222',
                            lineHeight: '54px',
                            letterSpacing: 0,
                        }}
                    >
                        Diskominfosantik Kabupaten Bekasi
                    </span>
                </div>

                {/* Main Title */}
                <div style={{ marginBottom: '40px' }}>
                    <div
                        style={{
                            fontSize: '64px',
                            fontWeight: 700,
                            color: '#111',
                            lineHeight: '1',
                            marginTop: '50px',
                            marginBottom: '10px',
                        }}
                    >
                        Laporan Sistem
                    </div>
                    <div
                        style={{
                            fontSize: '64px',
                            fontWeight: 700,
                            color: '#111',
                            lineHeight: '1',
                        }}
                    >
                        Pelayanan <span style={{ color: '#D32F2F' }}>Lapor AA</span>
                    </div>
                </div>

                {/* Periode Info */}
                <div>
                    <div
                        style={{
                            fontWeight: 700,
                            fontSize: '32px',
                            lineHeight: '1.2',
                            marginBottom: '10px',
                            color: '#111',
                        }}
                    >
                        {periodInfo.periodType}
                    </div>
                    <div
                        style={{
                            fontWeight: 400,
                            fontSize: '28px',
                            color: '#111',
                            marginBottom: '2px',
                            lineHeight: '1.2',
                        }}
                    >
                        {periodInfo.periodDescription}
                    </div>
                    <div
                        style={{
                            fontWeight: 400,
                            fontSize: '28px',
                            color: '#111',
                            lineHeight: '1.2',
                        }}
                    >
                        {periodInfo.weekInfo}
                    </div>

                    {/* Timestamp positioned at bottom like Page1Cover - outside the main flex container */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '40px',
                            left: '20px',
                            fontWeight: 400,
                            fontSize: '28px',
                            color: '#111',
                            lineHeight: '1.2',
                        }}
                    >
                        {displayDate}
                    </div>
                </div>
            </div>

            {/* Kanan: Foto Bupati */}
            <div style={{ flex: '0 0 400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '500px' }}>
                <img
                    src={MASKOT_SRC}
                    alt="Bupati"
                    style={{
                        width: '500px',
                        height: 'auto',
                        objectFit: 'contain',
                        background: 'none',
                        display: 'block',
                        margin: '0 auto',
                    }}
                />
            </div>
        </div>
    </ReportPageWrapper>
    );
};

export default Page1Cover;

import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';

const LOGO_SRC = '/LAPOR AA BUPATI.png';   // path logo Bekasi
const MASKOT_SRC = '/LAPOR AA BUPATI.png';      // path foto bupati PNG (tanpa badge)

const Page1Cover: React.FC = () => (
    <ReportPageWrapper pageNumber={1}>

        {/* Wrapper for main content, 2 columns */}
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            marginLeft: '20px',       // Hilangkan margin kiri
            marginRight: '20px',     // Tetap ada margin kanan
            marginBottom: '20px',
            marginTop: '40px',
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
                        Periode Mingguan
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
                        Minggu Ke-1 (2-8 Juni)
                    </div>
                    <div
                        style={{
                            fontWeight: 400,
                            fontSize: '28px',
                            color: '#111',
                            lineHeight: '1.2',
                        }}
                    >
                        Juni Tahun 2025
                    </div>

                    <div
                        style={{
                            marginTop: '100px',
                            fontWeight: 400,
                            fontSize: '28px',
                            color: '#111',
                            lineHeight: '1.2',
                        }}
                    >
                        25 Juni 2025 | 15.00 WIB
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

export default Page1Cover;

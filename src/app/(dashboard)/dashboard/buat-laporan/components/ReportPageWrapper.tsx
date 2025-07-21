import React from 'react';
import { ReportTemplate } from '../types/ReportTemplate';

interface ReportPageWrapperProps {
    children: React.ReactNode;
    template?: ReportTemplate;
}

const ReportPageWrapper: React.FC<ReportPageWrapperProps> = ({ children, template }) => {
    // Fallback untuk tanggal jika template tidak tersedia
    const displayDate = template?.reportGeneratedAt || '25 Juni 2025 | 15.00 WIB';
    
    return (
        <div
            className="report-page-wrapper"
            style={{
                width: '1200px',           // Kembali ke landscape
                height: '675px',           // Kembali ke landscape
                background: '#fff',
                position: 'relative',
                margin: '0 auto',          // Hanya center horizontal
                boxShadow: 'none',
                borderRadius: 0,           // No rounded
                overflow: 'hidden',
                marginBottom: '0px',       // Hilangkan margin bottom
            }}
        >
            {/* Sidebar kiri */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '54px',           // Sedikit lebih tebal agar pas dengan gambar
                    background: '#fff',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    borderRight: '3px solid #222', // Garis hitam di kanan
                }}
            >
                {/* Tanggal vertikal dengan CSS Transform */}
                <div
                    style={{
                        position: 'absolute',
                        top: '120px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(-90deg)',
                        transformOrigin: 'center',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        color: '#BDBDBD',
                        fontWeight: '400',
                        letterSpacing: '0.2px',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        // Tambahan untuk PDF compatibility
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                    }}
                >
                    {displayDate}
                </div>

                {/* Judul sidebar vertikal dengan CSS Transform */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '120px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(-90deg)',
                        transformOrigin: 'center',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '18px',
                        color: '#B91C1C',
                        fontWeight: '700',
                        letterSpacing: '0.4px',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        // Tambahan untuk PDF compatibility
                        textRendering: 'optimizeLegibility',
                        WebkitFontSmoothing: 'antialiased',
                    }}
                >
                    Lapor AA Bupati
                </div>
            </div>

            {/* Strip bawah gradient merah-oren */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: '100%',
                    height: '20px',
                    background: 'linear-gradient(90deg,rgb(218, 56, 56) 0%,rgb(255, 119, 55) 100%)',
                    zIndex: 200,
                }}
            />

            {/* Konten, area utama */}
            <div
                style={{
                    position: 'absolute',
                    left: '54px',           // Sama dengan lebar sidebar
                    top: 0,
                    right: 0,
                    bottom: '20px',         // Sesuaikan dengan tinggi strip
                    padding: '0px',         // Hilangkan semua padding untuk mencegah overflow
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'stretch',
                    background: '#fff',
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default ReportPageWrapper;
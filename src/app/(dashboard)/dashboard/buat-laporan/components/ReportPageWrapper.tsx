import React from 'react';

interface ReportPageWrapperProps {
    children: React.ReactNode;
    pageNumber: number;
}

const ReportPageWrapper: React.FC<ReportPageWrapperProps> = ({ children, pageNumber }) => {
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
                marginBottom: '20px',      // Jarak antar halaman
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
                {/* Tanggal vertikal dengan SVG */}
                <svg height="230" width="40" style={{ position: 'absolute', top: '-5px' }}>
                    <text 
                        x="27" 
                        y="230" 
                        transform="rotate(-90 27,230)" 
                        fontFamily="Inter" 
                        fontSize="16" 
                        fill="#BDBDBD" 
                        fontWeight="400"
                        letterSpacing="0.2"
                        textAnchor="start"
                    >
                        25 Juni 2025 | 15.00 WIB
                    </text>
                </svg>

                {/* Judul sidebar vertikal dengan SVG */}
                <svg height="230" width="40" style={{ position: 'absolute', bottom: '50px' }}>
                    <text 
                        x="27" 
                        y="230" 
                        transform="rotate(-90 27,230)" 
                        fontFamily="Inter" 
                        fontSize="18" 
                        fill="#B91C1C" 
                        fontWeight="700"
                        letterSpacing="0.4"
                        textAnchor="start"
                    >
                        Lapor AA Bupati
                    </text>
                </svg>
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
                    bottom: '18px',        // Tidak menimpa strip bawah
                    padding: '0 20px 0 20px', // Padding yang lebih seimbang
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
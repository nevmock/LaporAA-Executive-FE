import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';
import { ReportTemplate, generatePeriodDescription } from '../types/ReportTemplate';

interface Page9ClosingProps {
    template?: ReportTemplate;
}

const Page9Closing: React.FC<Page9ClosingProps> = ({ template }) => {
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
      {/* Wrapper for main content, matching Page1Cover style */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        marginLeft: '0px',
        marginRight: '0px',
        marginBottom: '0px',
        marginTop: '0px',
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: '20px',
        position: 'relative',
      }}>
        {/* Kiri: Text Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
          {/* Header Logo + Dinas - same as Page1Cover */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              marginBottom: '30px',
            }}
          >
            <img
              src="/kab-bekasi1.png"
              alt="Logo Kabupaten Bekasi"
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

          {/* Main Title - Terima Kasih bigger and centered vertically */}
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '100px',
                fontWeight: 500,
                color: '#D32F2F',
                lineHeight: '1',
                marginTop: '120px',
                marginBottom: '10px',
              }}
            >
              Terima Kasih
            </div>
          </div>

          {/* Subtitle - matching Page1Cover style */}
          <div>
            <div
              style={{
                fontWeight: 400,
                fontSize: '32px',
                lineHeight: '1.2',
                marginBottom: '2px',
                color: '#111',
              }}
            >
              Laporan Sistem
            </div>
            <div
              style={{
                fontWeight: 400,
                fontSize: '32px',
                color: '#111',
                marginBottom: '2px',
                lineHeight: '1.2',
              }}
            >
              Pelayanan Lapor AA
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

        {/* Kanan: Gambar Bupati - same style as Page1Cover */}
        <div style={{
          flex: '0 0 400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: '500px'
        }}>
          <img
            src="/LAPOR AA BUPATI.png"
            alt="Lapor AA Bupati"
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

export default Page9Closing;

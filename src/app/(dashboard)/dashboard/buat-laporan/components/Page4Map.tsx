import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';

const Page4Map: React.FC = () => {
  return (
    <ReportPageWrapper pageNumber={4}>
      {/* Page Title */}
      <div 
        className="font-bold text-center mb-6"
        style={{ 
          fontSize: '32px', 
          lineHeight: '36px',
          color: 'rgb(196,32,32)',
          marginTop: '20px'
        }}
      >
        PETA SEBARAN LAPORAN
      </div>

      {/* Agency Name */}
      <div 
        className="text-center text-black font-normal mb-4"
        style={{
          fontSize: '18px',
          lineHeight: '22px'
        }}
      >
        Diskominfosantik Kabupaten Bekasi
      </div>

      {/* Periode */}
      <div 
        className="text-center text-black font-normal mb-8"
        style={{
          fontSize: '16px',
          lineHeight: '20px'
        }}
      >
        Periode Bulanan - Juli 2025
      </div>

      {/* Map Placeholder Area */}
      <div 
        className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg mx-auto"
        style={{
          width: '600px',
          height: '280px'
        }}
      >
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🗺️</div>
          <div className="text-2xl font-semibold">Peta Kabupaten Bekasi</div>
          <div className="text-lg">Peta sebaran laporan akan ditampilkan di sini</div>
          <div className="text-sm mt-2">Map dengan marker lokasi laporan</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center mt-4">
        <div className="flex space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Tinggi (&gt;20)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span>Sedang (10-20)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Rendah (&lt;10)</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="absolute bottom-6 right-6 text-black font-normal"
        style={{
          fontSize: '12px',
          lineHeight: '14px'
        }}
      >
        *Data Per [TANGGAL] | [WAKTU]
      </div>
    </ReportPageWrapper>
  );
};

export default Page4Map;

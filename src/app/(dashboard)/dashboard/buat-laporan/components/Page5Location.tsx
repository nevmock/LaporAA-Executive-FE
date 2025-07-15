import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';

const Page5Location: React.FC = () => {
  return (
    <ReportPageWrapper pageNumber={5}>
      {/* Page Title */}
      <div 
        className="font-bold text-center mb-6"
        style={{ 
          fontSize: '28px', 
          lineHeight: '32px',
          color: 'rgb(196,32,32)',
          marginTop: '20px'
        }}
      >
        STATISTIK BERDASARKAN LOKASI
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Left Side - Top Locations */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-800">Top 10 Lokasi Laporan</h3>
          <div className="space-y-3">
            {Array.from({length: 8}, (_, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center mr-3">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">[NAMA LOKASI {i + 1}]</span>
                </div>
                <span className="text-sm font-bold text-blue-600">[XX]</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Chart */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-800">Distribusi per Kecamatan</h3>
          <div 
            className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg"
            style={{ height: '300px' }}
          >
            <div className="text-center text-gray-500">
              <div className="text-3xl mb-3">📍</div>
              <div className="text-lg font-semibold">Chart Lokasi</div>
              <div className="text-sm">Bar Chart / Donut Chart</div>
            </div>
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

export default Page5Location;

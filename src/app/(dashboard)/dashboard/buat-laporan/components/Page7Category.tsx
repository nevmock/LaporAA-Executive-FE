import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';

const Page7Category: React.FC = () => {
  return (
    <ReportPageWrapper pageNumber={7}>
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
        STATISTIK BERDASARKAN KATEGORI
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-2 gap-6 h-full">
        {/* Left Side - Top Categories */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-800">Top 10 Kategori Laporan</h3>
          <div className="space-y-2">
            {Array.from({length: 10}, (_, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                <div className="flex items-center">
                  <span className="w-5 h-5 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center mr-2">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium">[NAMA KATEGORI {i + 1}]</span>
                </div>
                <span className="text-xs font-bold text-yellow-600">[XXX]</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Chart */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-800">Distribusi Laporan per Kategori</h3>
          <div 
            className="bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg"
            style={{ height: '300px' }}
          >
            <div className="text-center text-gray-500">
              <div className="text-3xl mb-3">📂</div>
              <div className="text-lg font-semibold">Chart Kategori</div>
              <div className="text-sm">Horizontal Bar Chart</div>
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

export default Page7Category;

import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';

const Page8Satisfaction: React.FC = () => {
  return (
    <ReportPageWrapper pageNumber={8}>
      {/* Title */}
      <div 
        className="font-bold text-center mb-2"
        style={{ fontSize: '32px', lineHeight: '36px', color: 'rgb(196,32,32)', marginTop: '20px' }}
      >
        TINGKAT KEPUASAN
      </div>
      {/* Agency Name */}
      <div className="text-center text-black font-normal mb-2" style={{ fontSize: '18px', lineHeight: '22px' }}>
        Diskominfosantik Kabupaten Bekasi
      </div>
      {/* Periode */}
      <div className="text-center text-black font-normal mb-6" style={{ fontSize: '16px', lineHeight: '20px' }}>
        Periode Bulanan - Juli 2025
      </div>
      {/* Satisfaction Summary */}
      <div className="flex flex-col items-center justify-center w-full">
        {/* Average Rating */}
        <div className="text-6xl font-bold text-yellow-600 mb-2">4.3</div>
        <div className="text-yellow-700 text-lg mb-1">Rating Rata-rata</div>
        <div className="text-yellow-600 text-sm mb-6">dari 751 total rating</div>
        {/* Rating Distribution */}
        <div className="w-full max-w-xl space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">★★★★★</span>
              <span className="text-sm text-yellow-700">5 bintang</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800 font-bold">345</span>
              <span className="text-yellow-600 text-sm">(45.9%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">★★★★</span>
              <span className="text-sm text-yellow-700">4 bintang</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800 font-bold">234</span>
              <span className="text-yellow-600 text-sm">(31.2%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">★★★</span>
              <span className="text-sm text-yellow-700">3 bintang</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800 font-bold">112</span>
              <span className="text-yellow-600 text-sm">(14.9%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">★★</span>
              <span className="text-sm text-yellow-700">2 bintang</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800 font-bold">42</span>
              <span className="text-yellow-600 text-sm">(5.6%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-600">★</span>
              <span className="text-sm text-yellow-700">1 bintang</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800 font-bold">18</span>
              <span className="text-yellow-600 text-sm">(2.4%)</span>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="text-black font-normal mt-4" style={{ fontSize: '16px', lineHeight: '22px' }}>
          *Data Per 09 Juli 2025 | 15.30 WIB
        </div>
      </div>
    </ReportPageWrapper>
  );
};

export default Page8Satisfaction;

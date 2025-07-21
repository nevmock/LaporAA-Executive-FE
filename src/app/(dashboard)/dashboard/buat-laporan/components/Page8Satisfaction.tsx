import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import ReportContentWrapper from './ReportContentWrapper';
import { ReportTemplate } from '../types/ReportTemplate';

interface Page8SatisfactionProps {
    template?: ReportTemplate;
    reportData?: any; // API data dari backend
}

const Page8Satisfaction: React.FC<Page8SatisfactionProps> = ({ template, reportData }) => {
  
  // Extract satisfaction data dari reportData, TIDAK menggunakan data dummy
  const satisfactionData = reportData?.satisfaction || {
    averageRating: 0,
    totalRated: 0,
    distribution: []
  };

  return (
    <ReportContentWrapper title="Tingkat Kepuasan Masyarakat" template={template}>
      {/* Satisfaction Summary */}
      <div className="flex flex-col items-center justify-center h-full">
        {/* Average Rating */}
        <div className="text-6xl font-bold text-yellow-600 mb-2">{satisfactionData.averageRating}</div>
        <div className="text-yellow-700 text-lg mb-1">Rating Rata-rata</div>
        <div className="text-yellow-600 text-sm mb-6">dari {satisfactionData.totalRated} total rating</div>
        
        {/* Rating Distribution */}
        <div className="w-full max-w-xl space-y-2 mb-6">
          {satisfactionData.distribution.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">
                  {'★'.repeat(item.rating)}
                </span>
                <span className="text-sm text-yellow-700">{item.rating} bintang</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-800 font-bold">{item.count}</span>
                <span className="text-yellow-600 text-sm">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ReportContentWrapper>
  );
};

export default Page8Satisfaction;

import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';
import { ReportTemplate, generatePeriodDescription } from '../types/ReportTemplate';

interface ReportContentWrapperProps {
  title: string;
  children: React.ReactNode;
  template?: ReportTemplate;
}

const ReportContentWrapper: React.FC<ReportContentWrapperProps> = ({ title, children, template }) => {
  // Fallback untuk tanggal jika template tidak tersedia
  const displayDate = template?.reportGeneratedAt || '25 Juni 2025 | 15.00 WIB';
  
  // Generate periode dinamis
  const periodInfo = template ? 
    generatePeriodDescription(template.startDate, template.endDate) : 
    {
      periodType: 'Periode Mingguan',
      periodDescription: 'Minggu Ke-1 (2-8 Juni), Juni Tahun 2025'
    };
  
  return (
    <ReportPageWrapper template={template}>
      {/* Fixed Height Container for PDF with margins */}
      <div className="h-[580px] flex flex-col px-6 py-4">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="text-base font-medium text-black">
            Diskominfosantik Kabupaten Bekasi
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-black">{periodInfo.periodType}</div>
            <div className="text-sm text-gray-600">{periodInfo.periodDescription}</div>
          </div>
        </div>

        {/* Main Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-black">{title}</h1>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {children}
        </div>

        {/* Footer */}
        <div className="text-right text-xs text-gray-600 mt-3">
          *Data Per {displayDate}
        </div>
        
      </div>
    </ReportPageWrapper>
  );
};

export default ReportContentWrapper;

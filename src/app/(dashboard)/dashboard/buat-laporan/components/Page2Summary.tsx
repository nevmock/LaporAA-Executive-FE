import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import ReportContentWrapper from './ReportContentWrapper';
import { ReportTemplate } from '../types/ReportTemplate';

interface Page2SummaryProps {
    template?: ReportTemplate;
    reportData?: any; // API data dari backend
    isPrintMode?: boolean; // Flag untuk mode print
}

const Page2Summary: React.FC<Page2SummaryProps> = ({ template, reportData, isPrintMode = false }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartImageUrl, setChartImageUrl] = useState<string>('');

  // Extract data dari reportData jika tersedia, gunakan data kosong jika tidak ada
  const summaryData = reportData?.summary || {
    totalReports: 0,
    resolvedReports: 0,
    pendingReports: 0,
    resolutionRate: 0
  };

  // Urutan status yang sesuai dengan SummaryPieChart
  const STATUS_ORDER = [
    'Perlu Verifikasi',
    'Verifikasi Situasi',
    'Verifikasi Kelengkapan Berkas',
    'Proses OPD Terkait',
    'Selesai Penanganan',
    'Selesai Pengaduan',
    'Ditutup',
  ];

  // Warna status yang sesuai dengan SummaryPieChart
  const STATUS_COLORS: Record<string, string> = {
    'Perlu Verifikasi': '#ef4444',        // red
    'Verifikasi Situasi': '#a855f7',      // violet
    'Verifikasi Kelengkapan Berkas': '#f97316', // orange
    'Proses OPD Terkait': '#eab308',      // yellow
    'Selesai Penanganan': '#3b82f6',      // blue
    'Selesai Pengaduan': '#22c55e',       // green
    'Ditutup': '#374151',                 // black/gray
  };

  // Status distribution - gunakan data real dari map features
  const statusCounts: Record<string, number> = (() => {
    if (!reportData?.map?.features || reportData.map.features.length === 0) {
      return {
        'Perlu Verifikasi': 0,
        'Verifikasi Situasi': 0,
        'Verifikasi Kelengkapan Berkas': 0,
        'Proses OPD Terkait': 0,
        'Selesai Penanganan': 0,
        'Selesai Pengaduan': 0,
        'Ditutup': 0,
      };
    }
    
    // Hitung status real dari map features
    const statusCount: Record<string, number> = {
      'Perlu Verifikasi': 0,
      'Verifikasi Situasi': 0,
      'Verifikasi Kelengkapan Berkas': 0,
      'Proses OPD Terkait': 0,
      'Selesai Penanganan': 0,
      'Selesai Pengaduan': 0,
      'Ditutup': 0,
    };
    
    // Count status dari setiap feature
    reportData.map.features.forEach((feature: any) => {
      const status = feature.properties.status;
      if (statusCount.hasOwnProperty(status)) {
        statusCount[status]++;
      } else {
        // Jika status tidak dikenal, masukkan ke "Perlu Verifikasi"
        statusCount['Perlu Verifikasi']++;
      }
    });
    
    return statusCount;
  })();

  // Prepare chart data sesuai dengan format SummaryPieChart
  const statusData = STATUS_ORDER.map(status => ({
    name: status,
    value: statusCounts[status] || 0,
    itemStyle: {
      color: STATUS_COLORS[status] || '#6b7280'
    }
  })).filter(item => item.value > 0);

  // Check if all data is zero
  const allZero = Object.values(statusCounts).every(count => count === 0);

  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);
      
      // Konfigurasi chart yang sesuai dengan SummaryPieChart
      const option = {
        backgroundColor: '#ffffff',
        tooltip: { 
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#374151',
          textStyle: {
            color: '#ffffff'
          }
        },
        legend: { 
          show: false // Hide legend untuk Page2Summary
        },
        // Tambahkan padding agar label tidak terpotong
        grid: {
          containLabel: true
        },
        series: [{
          name: 'Status',
          type: 'pie',
          radius: '60%', // Pie chart penuh, bukan donut
          center: ['50%', '50%'], // Center position
          data: allZero ? [{ name: 'Tidak ada data', value: 1, itemStyle: { color: '#f3f4f6' } }] : statusData,
          label: {
            show: !allZero,
            formatter: '{b}\n{d}%', // Pisahkan nama dan persentase dengan newline
            position: 'outside',
            fontSize: 11,
            color: '#374151',
            fontWeight: '500',
            lineHeight: 16,
            rich: {
              name: {
                fontSize: 11,
                fontWeight: '500'
              },
              value: {
                fontSize: 10,
                fontWeight: '400'
              }
            }
          },
          labelLine: { 
            show: !allZero,
            length: 20, // Panjangkan garis penunjuk
            length2: 15, // Panjangkan segmen kedua
            smooth: 0.2, // Buat garis sedikit melengkung
            lineStyle: {
              color: '#9ca3af',
              width: 1.5, // Tebalkan garis agar lebih jelas
              type: 'solid'
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderColor: '#fff',
              borderWidth: 2
            },
            scale: true,
            scaleSize: 5
          },
          ...(allZero && {
            label: {
              show: true,
              position: 'center',
              formatter: 'Tidak ada data',
              fontSize: 14,
              color: '#9ca3af',
            },
            emphasis: { disabled: true }
          })
        }],
        animation: false,
        animationDuration: 0
      };

      chartInstance.setOption(option);

      // Convert chart to image for print mode
      if (isPrintMode) {
        setTimeout(() => {
          try {
            const imageUrl = chartInstance.getDataURL({
              type: 'png',
              pixelRatio: 2,
              backgroundColor: '#ffffff'
            });
            setChartImageUrl(imageUrl);
          } catch (error) {
            console.error('Error converting chart to image:', error);
          }
        }, 100);
      }

      // Cleanup function
      return () => {
        chartInstance.dispose();
      };
    }
  }, [statusData, allZero, isPrintMode]);

  // Calculate growth percentage (dummy untuk sekarang)
  const growthPercentage = 25;
  return (
    <ReportContentWrapper title="Ringkasan Status Pengaduan" template={template}>
      
      {/* Main Content - 2 Columns */}
      <div className="grid grid-cols-2 gap-8 h-full">
        
        {/* Left Column - Cards */}
        <div className="space-y-2">
          
          {/* Top Row - Summary Cards */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            
            {/* Total Laporan Masuk */}
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 font-medium">Total Laporan Masuk</span>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-4xl font-black text-black">{summaryData.totalReports}</div>
                <div className="flex items-center text-green-500 text-sm font-medium">
                </div>
              </div>
            </div>

            {/* Total Tindak Lanjut */}
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 font-medium">Total Tindak Lanjut</span>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-4xl font-black text-black">{summaryData.resolvedReports}</div>
              </div>
            </div>
            
          </div>

          {/* Status Cards */}
          <div className="space-y-2">
            
            {STATUS_ORDER.map((status, index) => {
              const count = statusCounts[status] || 0;
              const color = STATUS_COLORS[status] || '#6b7280';
              
              return (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-xs text-gray-700 font-medium">{status}</span>
                  </div>
                  <span className="text-lg font-black text-black">{count}</span>
                </div>
              );
            })}
            
          </div>
        </div>

        {/* Right Column - Pie Chart */}
        <div className="flex items-center justify-center">
          <div className="w-full h-full max-w-md max-h-96">
            {isPrintMode && chartImageUrl ? (
              // Show image in print mode
              <img 
                src={chartImageUrl} 
                alt="Pie Chart Status Pengaduan"
                className="w-full h-full object-contain"
                style={{ minHeight: '400px', minWidth: '400px' }}
              />
            ) : (
              // Show interactive chart in normal mode
              <div 
                ref={chartRef} 
                className="w-full h-full"
                style={{ minHeight: '400px', minWidth: '400px' }}
              ></div>
            )}
          </div>
        </div>
        
      </div>
      
    </ReportContentWrapper>
  );
};

export default Page2Summary;

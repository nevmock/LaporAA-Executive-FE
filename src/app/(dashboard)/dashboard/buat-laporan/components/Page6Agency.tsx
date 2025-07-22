import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import ReportContentWrapper from './ReportContentWrapper';
import { ReportTemplate } from '../types/ReportTemplate';
import { getOPDShortName } from '../../../../../utils/opdMapping';

interface Page6AgencyProps {
    template?: ReportTemplate;
    reportData?: any; // API data dari backend
    isPrintMode?: boolean; // Flag untuk mode print
}

interface AgencyItem {
  name: string;
  shortName?: string;
  count: number;
}

const Page6Agency: React.FC<Page6AgencyProps> = ({ template, reportData, isPrintMode = false }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartImageUrl, setChartImageUrl] = useState<string>('');
  
  // Fallback untuk tanggal jika template tidak tersedia
  const displayDate = template?.reportGeneratedAt || '25 Juni 2025 | 15.00 WIB';

  // Extract date range dari template atau reportData
  const startDate = template?.startDate || reportData?.period?.startDate;
  const endDate = template?.endDate || reportData?.period?.endDate;
  
  // Format tanggal untuk display
  const formatDateRange = () => {
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const end = new Date(endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long', 
        year: 'numeric'
      });
      return `${start} - ${end}`;
    }
    return 'Rentang Waktu Tersebut';
  };

  // Extract OPD data dari reportData, TIDAK menggunakan data dummy
  const agencyData = reportData?.opd || [];

  // Filter data yang valid dan sort by total descending
  const filteredData = agencyData
    .filter((item: any) => {
      // Filter out null, undefined, empty string, atau data tidak valid
      return item && 
             item.opd && 
             item.opd.trim() !== '' && 
             item.opd.toLowerCase() !== 'null' &&
             item.total !== null && 
             item.total !== undefined && 
             !isNaN(item.total) &&
             item.total > 0; // Hanya ambil yang punya count > 0
    })
    .sort((a: any, b: any) => b.total - a.total) // Sort descending untuk Top 3
    .slice(0, 10)
    .map((item: any) => ({
      name: item.opd.trim(), // Simpan nama lengkap untuk value
      shortName: getOPDShortName(item.opd.trim()), // Tambah shortName untuk display
      count: item.total
    }));

  // Hitung total OPD yang valid (bukan total laporan)
  const totalOpd = agencyData.filter((item: any) => {
    return item && 
           item.opd && 
           item.opd.trim() !== '' && 
           item.opd.toLowerCase() !== 'null';
  }).length;

  // Untuk chart, kita perlu reverse order agar yang terbesar di atas
  const topAgencies: AgencyItem[] = [...filteredData].reverse();

  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);
      
      const option = {
        title: {
          text: `10 OPD dari ${totalOpd} Total OPD pada ${formatDateRange()}`,
          textStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#374151'
          },
          left: 'left',
          top: 10
        },
        grid: {
          left: '40%',
          right: '10%',
          top: '15%',
          bottom: '10%',
          containLabel: false
        },
        xAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            fontSize: 10,
            color: '#6B7280'
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#E5E7EB',
              width: 1
            }
          }
        },
        yAxis: {
          type: 'category',
          data: topAgencies.map((item: any) => item.shortName || getOPDShortName(item.name)),
          axisLine: {
            show: false
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            fontSize: 10,
            color: '#374151',
            fontWeight: 'normal',
            interval: 0,
            formatter: function(value: string) {
              // Truncate jika terlalu panjang untuk chart
              return value.length > 15 ? value.substring(0, 15) + '...' : value;
            }
          }
        },
        series: [
          {
            type: 'bar',
            data: topAgencies.map((item: AgencyItem) => item.count),
            itemStyle: {
              color: '#22C55E',
              borderRadius: [0, 4, 4, 0]
            },
            barWidth: '60%',
            label: {
              show: true,
              position: 'right',
              fontSize: 10,
              color: '#374151',
              fontWeight: 'bold',
              formatter: '{c}'
            }
          }
        ],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params: any) {
            return `${params[0].name}: ${params[0].value} laporan`;
          }
        },
        animation: false,
        animationDuration: 0
      };

      chart.setOption(option);

      // Convert chart to image for print mode
      if (isPrintMode) {
        setTimeout(() => {
          try {
            const imageUrl = chart.getDataURL({
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

      // Handle resize
      const handleResize = () => {
        chart.resize();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    }
  }, [topAgencies, isPrintMode]);

  return (
    <ReportContentWrapper title="Penanganan Berdasarkan Perangkat Daerah" template={template}>
      {/* Content Area */}
      <div className="w-full h-full">
        {/* Full Width Chart */}
        <div className="w-full h-full">
          {isPrintMode && chartImageUrl ? (
            // Show image in print mode
            <img 
              src={chartImageUrl} 
              alt="Grafik Distribusi OPD"
              className="w-full h-full object-contain"
              style={{ minHeight: '400px' }}
            />
          ) : (
            // Show interactive chart in normal mode
            <div 
              ref={chartRef}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
          )}
        </div>
      </div>
    </ReportContentWrapper>
  );
};

export default Page6Agency;

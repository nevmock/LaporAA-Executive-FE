import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import ReportContentWrapper from './ReportContentWrapper';
import { ReportTemplate } from '../types/ReportTemplate';

// Extend dayjs dengan plugin yang diperlukan
dayjs.extend(isSameOrBefore);

interface Page3ChartProps {
    template?: ReportTemplate;
    reportData?: any; // API data dari backend
    isPrintMode?: boolean; // Flag untuk mode print
}

const Page3Chart: React.FC<Page3ChartProps> = ({ template, reportData, isPrintMode = false }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartImageUrl, setChartImageUrl] = useState<string>('');

  useEffect(() => {
    if (chartRef.current) {
      const chartInstance = echarts.init(chartRef.current);
      
      // Extract trend data dari reportData atau gunakan data default
      const trendData = reportData?.trend?.daily || [];
      
      // Generate tanggal berdasarkan rentang dari template
      const startDate = dayjs(template?.startDate || dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
      const endDate = dayjs(template?.endDate || dayjs().format('YYYY-MM-DD'));
      
      // Buat array tanggal lengkap dari start sampai end
      const dateRange: Dayjs[] = [];
      let currentDate = startDate;
      while (currentDate.isSameOrBefore(endDate)) {
        dateRange.push(currentDate.clone());
        currentDate = currentDate.add(1, 'day');
      }
      
      // Siapkan data untuk chart
      const chartData: number[] = [];
      const fullLabels: string[] = []; // Label lengkap untuk setiap hari
      const monthMarkers: any[] = []; // Untuk garis pembatas bulan
      let lastMonth = '';
      
      dateRange.forEach((date, index) => {
        // Cari data untuk tanggal ini dari API
        const dayData = trendData.find((item: any) => 
          dayjs(item.date).isSame(date, 'day')
        );
        
        // Tambahkan data count
        chartData.push(dayData?.count || 0);
        
        // Format label tanggal lengkap
        const dayOfMonth = date.date();
        const monthName = date.format('MMM');
        const currentMonth = date.format('YYYY-MM');
        
        // Label lengkap untuk semua hari (digunakan untuk data, bukan tampilan)
        fullLabels.push(dayOfMonth.toString());
        
        // Deteksi pergantian bulan untuk garis pembatas
        if (currentMonth !== lastMonth && index > 0) {
          monthMarkers.push({
            xAxis: index - 0.5, // Posisi garis di tengah antara hari terakhir bulan lama dan hari pertama bulan baru
            label: {
              text: monthName,
              position: 'insideTopStart'
            }
          });
        }
        lastMonth = currentMonth;
      });
      
      // TIDAK menggunakan data dummy - gunakan data real dari API saja
      // Jika tidak ada data, chart akan menampilkan nilai 0 yang akurat
      
      // Hitung interval label dinamis berdasarkan jumlah hari
      const totalDays = dateRange.length;
      let labelInterval: number;
      
      if (totalDays <= 31) {
        labelInterval = 0; // Tampilkan semua label untuk bulan atau kurang
      } else if (totalDays <= 93) {
        labelInterval = 2; // Tampilkan setiap 3 hari untuk 1-3 bulan
      } else if (totalDays <= 186) {
        labelInterval = 6; // Tampilkan setiap 7 hari untuk 3-6 bulan
      } else if (totalDays <= 365) {
        labelInterval = 13; // Tampilkan setiap 14 hari untuk 6-12 bulan
      } else {
        labelInterval = 29; // Tampilkan setiap 30 hari untuk lebih dari 1 tahun
      }
      
      // Buat keterangan interval untuk title
      let intervalText = '';
      if (totalDays <= 31) {
        intervalText = '(Harian)';
      } else if (totalDays <= 93) {
        intervalText = '(Setiap 3 hari)';
      } else if (totalDays <= 186) {
        intervalText = '(Setiap 7 hari)';
      } else if (totalDays <= 365) {
        intervalText = '(Setiap 14 hari)';
      } else {
        intervalText = '(Setiap 30 hari)';
      }
      
      const option = {
        title: {
          text: `Grafik Laporan Masuk ${intervalText}\n${startDate.format('DD MMM YYYY')} - ${endDate.format('DD MMM YYYY')}`,
          left: 'left',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: function(params: any) {
            const dataIndex = params[0].dataIndex;
            const date = dateRange[dataIndex];
            const count = params[0].value;
            return `${date.format('DD MMMM YYYY')}<br/>Laporan: ${count}<br/><small>Interval tampilan: ${intervalText}</small>`;
          }
        },
        grid: {
          left: '60px',
          right: '40px',
          bottom: '80px',
          top: '80px',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: fullLabels,
          name: 'Tanggal dalam Bulan',
          nameLocation: 'middle',
          nameGap: 35,
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          axisTick: {
            alignWithLabel: true
          },
          axisLabel: {
            formatter: function(value: string, index: number) {
              // Hanya tampilkan label untuk index yang sesuai dengan interval
              if (labelInterval === 0 || index % (labelInterval + 1) === 0) {
                const date = dateRange[index];
                // Tampilkan tanggal dengan keterangan bulan untuk tanggal 1 atau awal bulan
                if (date.date() === 1) {
                  return `1\n${date.format('MMM')}`;
                }
                // Untuk rentang panjang, tampilkan format yang lebih informatif
                if (totalDays > 186) {
                  return `${date.date()}\n${date.format('MMM')}`;
                }
                return value;
              }
              return ''; // Sembunyikan label yang tidak sesuai interval
            },
            interval: 0, // Kita handle sendiri di formatter
            fontSize: 10,
            rotate: totalDays > 93 ? 45 : 0 // Rotasi label untuk rentang panjang
          }
        },
        yAxis: {
          type: 'value',
          name: 'Jumlah Laporan',
          nameLocation: 'middle',
          nameGap: 40,
          min: 0,
          max: Math.max(...chartData) + 20,
          axisLine: {
            lineStyle: {
              color: '#666'
            }
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: '#e0e0e0'
            }
          }
        },
        series: [
          {
            name: 'Laporan Masuk',
            type: 'line',
            data: chartData,
            lineStyle: {
              color: '#3b82f6',
              width: 3
            },
            itemStyle: {
              color: '#3b82f6',
              borderWidth: 2,
              borderColor: '#ffffff'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(59, 130, 246, 0.3)'
                  },
                  {
                    offset: 1,
                    color: 'rgba(59, 130, 246, 0.05)'
                  }
                ]
              }
            },
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            markLine: {
              silent: true,
              lineStyle: {
                color: '#ff6b6b',
                type: 'dashed',
                width: 2
              },
              label: {
                position: 'insideEndTop',
                formatter: '{b}',
                fontSize: 10,
                color: '#ff6b6b',
                fontWeight: 'bold'
              },
              data: monthMarkers
            }
          }
        ],
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

      // Handle resize
      const handleResize = () => {
        chartInstance.resize();
      };
      
      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        chartInstance.dispose();
      };
    }
  }, [reportData, template?.startDate, template?.endDate, isPrintMode]);

  return (
    <ReportContentWrapper title="Grafik Laporan Masuk" template={template}>
      {/* Chart Content */}
      <div className="h-full flex flex-col justify-center items-center">
        {/* Chart Area */}
        {isPrintMode && chartImageUrl ? (
          // Show image in print mode
          <img 
            src={chartImageUrl} 
            alt="Grafik Laporan Masuk"
            className="w-full h-full object-contain"
            style={{
              minHeight: '400px',
              maxHeight: '450px'
            }}
          />
        ) : (
          // Show interactive chart in normal mode
          <div 
            ref={chartRef} 
            className="w-full h-full"
            style={{
              minHeight: '400px',
              maxHeight: '450px'
            }}
          ></div>
        )}
      </div>
    </ReportContentWrapper>
  );
};

export default Page3Chart;
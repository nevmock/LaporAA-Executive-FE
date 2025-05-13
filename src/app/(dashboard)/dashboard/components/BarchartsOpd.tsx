import React from 'react';
import { MoreVertical } from 'react-feather';
import ReactECharts from 'echarts-for-react';
import data from '../../../../api/dataPresentasiOpd.json';

const BarchartsOpd = () => {
  const sorted = data.sort((a, b) => b.score_ranking - a.score_ranking);

  // Buat xAxis dan yAxis data
  const yAxisData = sorted.map((item) => item.name_opd); // Y axis karena horizontal bar
  const xAxisData = sorted.map((item) => item.score_ranking); // Nilai bar-nya

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params: any) {
        const data = params[0].data;
        return `
    <strong>${data.opd}</strong><br/>
    Score: ${data.value}<br/>
    Coverage: ${data.coverage}<br/>
    Agility: ${data.agility}<br/>
    Resolution: ${data.resolution}<br/>
    Experience: ${data.experience}
  `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01],
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: yAxisData,
    },
    series: [
      {
        name: 'Skor Ranking',
        type: 'bar',
        data: sorted.map((item) => ({
          value: item.score_ranking,
          opd: item.opd,
          name_opd: item.name_opd,
          coverage: item.coverage,
          agility: item.agility,
          resolution: item.resolution,
          experience: item.experience,
        })),
      },
    ],
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-800">
          Tasks Performance
        </h4>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Chart */}
      <div className="mb-6 ">
        <ReactECharts option={option} style={{ height: '500px' }} />
      </div>
    </div>
  );
};

export default BarchartsOpd;

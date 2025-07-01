import React from 'react';

interface BoundariesLegendProps {
  kecamatanList: string[];
  selectedKecamatan: string;
  onKecamatanSelect: (kecamatan: string) => void;
  visible: boolean;
}

export default function BoundariesLegend({ 
  kecamatanList, 
  selectedKecamatan, 
  onKecamatanSelect,
  visible 
}: BoundariesLegendProps) {
  if (!visible || kecamatanList.length === 0) return null;

  // Generate warna yang sama dengan peta
  const getKecamatanColor = (kecamatanName: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#A3E4D7', '#FAD7A0', '#D5A6BD', '#AED6F1', '#A9DFBF',
      '#F9E79F', '#D2B4DE', '#A6E3E9'
    ];
    const colorIndex = Math.abs(kecamatanName.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className="absolute top-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-h-80 overflow-y-auto z-[1000]">
      <h4 className="font-semibold text-gray-800 mb-2 text-sm">Kecamatan</h4>
      <div className="space-y-1">
        <button
          onClick={() => onKecamatanSelect('Semua Kecamatan')}
          className={`flex items-center gap-2 text-xs text-gray-800 w-full text-left p-1 rounded hover:bg-gray-100 ${
            selectedKecamatan === 'Semua Kecamatan' ? 'bg-blue-50 border border-blue-200' : ''
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
          <span>Semua Kecamatan</span>
        </button>
        {kecamatanList.map(kecamatan => (
          <button
            key={kecamatan}
            onClick={() => onKecamatanSelect(kecamatan)}
            className={`flex items-center gap-2 text-xs text-gray-800 w-full text-left p-1 rounded hover:bg-gray-100 ${
              selectedKecamatan === kecamatan ? 'bg-blue-50 border border-blue-200' : ''
            }`}
          >
            <div 
              className="w-3 h-3 rounded-full border border-gray-400"
              style={{ backgroundColor: getKecamatanColor(kecamatan) }}
            ></div>
            <span className="truncate">{kecamatan}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

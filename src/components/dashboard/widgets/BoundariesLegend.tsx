import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

  // Note: getCurrentColor function removed as it was unused

  const allOptions = ['Semua Kecamatan', ...kecamatanList];

  return (
    <div ref={dropdownRef} className="absolute top-4 right-4 z-[1000]">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <div 
          className="w-3 h-3 rounded-full border border-gray-400 flex-shrink-0"
          style={{ 
            background: selectedKecamatan === 'Semua Kecamatan' 
              ? 'linear-gradient(to right, #60a5fa, #3b82f6)' 
              : getKecamatanColor(selectedKecamatan) 
          }}
        ></div>
        <span className="text-sm text-gray-800 flex-1 text-left truncate">
          {selectedKecamatan}
        </span>
        <FiChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto min-w-[200px] z-[1001]">
          {allOptions.map(option => (
            <button
              key={option}
              onClick={() => {
                onKecamatanSelect(option);
                setIsOpen(false);
              }}
              className={`flex items-center gap-2 text-sm text-gray-800 w-full text-left p-3 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                selectedKecamatan === option ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full border border-gray-400 flex-shrink-0"
                style={{ 
                  background: option === 'Semua Kecamatan' 
                    ? 'linear-gradient(to right, #60a5fa, #3b82f6)' 
                    : getKecamatanColor(option) 
                }}
              ></div>
              <span className="truncate">{option}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

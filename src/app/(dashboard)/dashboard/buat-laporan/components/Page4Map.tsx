import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReportContentWrapper from './ReportContentWrapper';
import { ReportTemplate } from '../types/ReportTemplate';
import axiosInstance from '@/utils/axiosInstance';

// Import icon yang sudah ada
const iconByStatus: Record<string, L.Icon> = {
  'Perlu Verifikasi': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Verifikasi Situasi': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Verifikasi Berkas': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Proses OPD Terkait': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Selesai Penanganan': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Selesai Pengaduan': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Ditutup': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
};

interface ReportFeature {
  type: 'Feature';
  properties: {
    sessionId: string;
    message: string;
    location: string;
    kecamatan: string;
    desa: string;
    status: string;
    createdAt: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

interface MapDataResponse {
  type: 'FeatureCollection';
  features: ReportFeature[];
}

interface AnalyticsResponse {
  success: boolean;
  message: string;
  data: {
    summary: any;
    trend: any;
    location: any;
    opd: any;
    category: any;
    satisfaction: any;
    map: MapDataResponse;
  };
  period: {
    startDate: string;
    endDate: string;
    duration: number;
  };
  generatedAt: string;
}

interface ReportMarker {
  id: number;
  lat: number;
  lng: number;
  status: string;
  title: string;
  category: string;
}

interface Page4MapProps {
    template?: ReportTemplate;
    reportData?: any; // API data dari backend (untuk backward compatibility)
}

const Page4Map: React.FC<Page4MapProps> = ({ template, reportData }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [reports, setReports] = useState<ReportMarker[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Convert reportData.map ke format ReportMarker
  useEffect(() => {
    if (reportData?.map?.features) {
      try {
        const apiReports: ReportMarker[] = reportData.map.features.map((feature: any, index: number) => ({
          id: parseInt(feature.properties.sessionId) || index + 1,
          lat: feature.geometry.coordinates[1], // Latitude adalah index ke-1
          lng: feature.geometry.coordinates[0], // Longitude adalah index ke-0
          status: feature.properties.status || 'Belum Diproses',
          title: feature.properties.message.substring(0, 50) + (feature.properties.message.length > 50 ? '...' : ''), 
          category: feature.properties.location || 'Laporan'
        }));
        
        setReports(apiReports);
        setError(null);
      } catch (err) {
        console.error('Error processing map data:', err);
        setError('Gagal memproses data peta');
        setReports([]);
      }
    } else {
      // Jika tidak ada data map, set sebagai array kosong
      setReports([]);
    }
  }, [reportData]);

  // Status colors untuk legend (tidak untuk marker, karena marker pakai icon)
  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'Perlu Verifikasi': return '#ef4444'; // red
      case 'Verifikasi Berkas': return '#f97316'; // orange
      case 'Proses OPD Terkait': return '#eab308'; // yellow
      case 'Verifikasi Situasi': return '#8b5cf6'; // purple
      case 'Selesai Penanganan': return '#3b82f6'; // blue
      case 'Selesai Pengaduan': return '#22c55e'; // green
      case 'Ditutup': return '#000000'; // black
      default: return '#6b7280'; // gray
    }
  };

  // Get icon berdasarkan status
  const getMarkerIcon = (status: string): L.Icon => {
    return iconByStatus[status] || iconByStatus['Perlu Verifikasi'];
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && reports.length > 0) {
      // Initialize map centered on Kabupaten Bekasi
      const map = L.map(mapRef.current, {
        center: [-6.2349, 107.1537], // Koordinat Kabupaten Bekasi
        zoom: 11,
        zoomControl: true,
        scrollWheelZoom: false,
        doubleClickZoom: true,
        dragging: true
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      // Add markers for each report
      reports.forEach((report) => {
        const marker = L.marker([report.lat, report.lng], {
          icon: getMarkerIcon(report.status)
        }).addTo(map);

        // Add popup dengan informasi laporan
        const popupContent = `
          <div class="p-2">
            <h3 class="font-bold text-sm mb-1">${report.title}</h3>
            <p class="text-xs text-gray-600 mb-1">Kategori: ${report.category}</p>
            <p class="text-xs text-gray-600 mb-1">Status: ${report.status}</p>
            <div class="mt-2 px-2 py-1 text-xs rounded" style="background: ${getMarkerColor(report.status)}; color: white;">
              ${report.status}
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent, {
          maxWidth: 200,
          className: 'custom-popup'
        });
      });

      mapInstanceRef.current = map;

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    }
  }, [reports]);

  return (
    <ReportContentWrapper title="Peta Persebaran Laporan" template={template}>
      {/* Map Content */}
      <div className="h-full flex flex-col">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <p className="text-sm text-gray-600">Silakan refresh halaman untuk mencoba lagi</p>
            </div>
          </div>
        )}

        {/* Map dengan data */}
        {!loading && !error && reports.length > 0 && (
          <>
            {/* Legend */}
            <div className="mb-3 flex flex-wrap justify-center gap-3 text-xs text-black">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                <span>Perlu Verifikasi</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                <span>Verifikasi Berkas</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                <span>Proses OPD</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
                <span>Verifikasi Situasi</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                <span>Selesai Penanganan</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                <span>Selesai Pengaduan</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-black rounded-full mr-1"></div>
                <span>Ditutup</span>
              </div>
            </div>
            
            {/* Map Container */}
            <div className="flex-1 relative">
              <div 
                ref={mapRef} 
                className="w-full h-full rounded-lg border border-gray-300"
                style={{ minHeight: '400px' }}
              ></div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && reports.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <p>Tidak ada data laporan untuk ditampilkan di peta</p>
              <p className="text-sm mt-2">Pastikan ada laporan dengan koordinat lokasi dalam rentang tanggal yang dipilih</p>
            </div>
          </div>
        )}
      </div>
    </ReportContentWrapper>
  );
};

export default Page4Map;

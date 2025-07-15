'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import axios from '../../../utils/axiosInstance';
import Legend from '../utils/legend';
import BoundariesLegend from '../widgets/BoundariesLegend';
import iconByStatus from '../utils/icons';
import { Report } from '../../../lib/types';
import dayjs from 'dayjs';
// Note: MdOutlineScreenshotMonitor and html2canvas imports removed as they were unused

// Base URL dari API backend
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

// Note: FILTERS, STATUS_OPTIONS, and months variables removed as they were unused

const now = dayjs();

// Type definitions for better type safety
interface BoundariesData {
  kecamatan?: GeoJSON.FeatureCollection;
  kabupaten?: GeoJSON.FeatureCollection;
}

interface LayerEvent {
  target: {
    setStyle: (style: Record<string, unknown>) => void;
  };
}

interface MapPersebaranProps {
  // Note: isFullscreen parameter removed as it was unused
  filter?: string;
  year?: number;
  month?: number;
  week?: number;
  selectedStatus?: string;
  selectedKecamatan?: string;
  limitView?: number;
  showBoundaries?: boolean;
  setBoundariesLoading?: (loading: boolean) => void;
}

// Komponen utama Peta Persebaran Laporan
export default function MapPersebaran({ 
  // Note: isFullscreen parameter removed as it was unused
  filter: initialFilter = 'monthly',
  year: initialYear = now.year(),
  month: initialMonth = now.month() + 1,
  week: initialWeek = 1,
  selectedStatus: initialSelectedStatus = 'Semua Status',
  selectedKecamatan: initialSelectedKecamatan = 'Semua Kecamatan',
  limitView: initialLimitView = 100,
  showBoundaries: initialShowBoundaries = true,
  setBoundariesLoading
}: MapPersebaranProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState(initialFilter);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [week, setWeek] = useState(initialWeek);
  const [selectedStatus, setSelectedStatus] = useState(initialSelectedStatus);
  const [selectedKecamatan, setSelectedKecamatan] = useState(initialSelectedKecamatan);
  const [limitView, setLimitView] = useState(initialLimitView);
  const [showBoundaries, setShowBoundaries] = useState(initialShowBoundaries);
  const [mapReady, setMapReady] = useState(false);
  const mapParentRef = useRef<HTMLDivElement>(null);
  // Note: isScreenshotLoading removed as it was unused
  const [boundariesData, setBoundariesData] = useState<BoundariesData | null>(null);
  const [boundariesLoadingInternal, setBoundariesLoadingInternal] = useState(false);
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);

  // Use external setBoundariesLoading if provided, otherwise use internal
  const handleSetBoundariesLoading = setBoundariesLoading || setBoundariesLoadingInternal;

  // Note: years and getWeeksInMonth variables removed as they were unused

  // Ambil data laporan dari backend berdasarkan filter
  const fetchData = useCallback(async () => {
    setMapReady(false);
    let url = `${API_URL}/dashboard/map?mode=${filter}&year=${year}`;
    if (filter !== 'yearly') url += `&month=${month}`;
    if (filter === 'weekly') url += `&week=${week}`;
    if (selectedStatus !== 'Semua Status') url += `&status=${encodeURIComponent(selectedStatus)}`;
    try {
      const res = await axios.get(url);
      setReports(res.data.data || []);
    } catch {
      console.error('❌ Gagal ambil data:');
      setReports([]); // Kosongkan data biar ga freeze
    } finally {
      setMapReady(true);
    }
  }, [filter, year, month, week, selectedStatus]);

  // Ambil data boundaries dari backend
  const fetchBoundaries = useCallback(async () => {
    if (boundariesData || boundariesLoadingInternal) return; // Skip jika sudah ada data atau sedang loading
    
    handleSetBoundariesLoading(true);
    try {
      // Menggunakan API baru untuk mendapatkan data GeoJSON Kabupaten Bekasi
      const res = await axios.get(`${API_URL}/geojson/kabupaten-bekasi`);
      
      if (res.data.success) {
        // Set data boundaries dari response API
        setBoundariesData({
          kecamatan: res.data.data, // Data GeoJSON semua kecamatan
          kabupaten: undefined // Akan diisi jika ada data kabupaten terpisah
        });
        
        // Extract daftar kecamatan dari data GeoJSON
        if (res.data.meta && res.data.meta.kecamatan_list) {
          setKecamatanList(res.data.meta.kecamatan_list);
        } else if (res.data.data && res.data.data.features) {
          // Fallback jika meta tidak ada, extract dari features
          const kecamatanNames: string[] = res.data.data.features
            .map((feature: GeoJSON.Feature) => feature.properties?.KECAMATAN)
            .filter((name: unknown): name is string => typeof name === 'string' && Boolean(name))
            .sort();
          setKecamatanList([...new Set(kecamatanNames)]);
        }
      } else {
        console.error('❌ API Error:', res.data.message);
        setBoundariesData(null);
      }
    } catch (err) {
      console.error('❌ Gagal ambil data boundaries:', err);
      setBoundariesData(null);
    } finally {
      handleSetBoundariesLoading(false);
    }
  }, [boundariesData, boundariesLoadingInternal, handleSetBoundariesLoading]);

  // Trigger fetch data setiap kali filter berubah
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch boundaries saat komponen pertama kali di-mount
  useEffect(() => {
    if (showBoundaries) {
      fetchBoundaries();
    }
  }, [showBoundaries, fetchBoundaries]);

  // Reset minggu ke-1 saat bulan/tahun/filter berubah
  useEffect(() => {
    setWeek(1);
  }, [month, year, filter]);

  // Sync external props with internal state
  useEffect(() => {
    setFilter(initialFilter);
    setYear(initialYear);
    setMonth(initialMonth);
    setWeek(initialWeek);
    setSelectedStatus(initialSelectedStatus);
    setSelectedKecamatan(initialSelectedKecamatan);
    setLimitView(initialLimitView);
    setShowBoundaries(initialShowBoundaries);
  }, [initialFilter, initialYear, initialMonth, initialWeek, initialSelectedStatus, initialSelectedKecamatan, initialLimitView, initialShowBoundaries]);

  // Auto-refresh data setiap 5 menit (ganti ke 1 menit buat development/test)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000); // 5 menit
    // console.info("✅ Memperbarui data peta");
    return () => clearInterval(interval);
  }, [fetchData]);

  // Note: handleDownloadCSV function removed as it was unused

  // Cari pusat peta dari laporan pertama yang valid (berkoordinat) Sort dulu, lalu limit, lalu filter valid koordinat
  const sortedLimitedReports = reports
    .slice()
    .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
    .slice(0, limitView);

  const validReports = sortedLimitedReports.filter(r => r.location?.latitude && r.location?.longitude);
  const firstValid = validReports[0];
  const mapCenter: [number, number] = firstValid
    ? [firstValid.location.latitude, firstValid.location.longitude]
    : [-6.2373, 107.1686]; // Default: Kabupaten Bekasi (sesuai dokumentasi API)

  // Styling untuk boundaries - Kecamatan dengan warna berbeda-beda
  const getKecamatanStyle = (feature?: GeoJSON.Feature) => {
    if (!feature || !feature.properties) return {};
    const kecamatanName = feature.properties.KECAMATAN;
    const isSelected = selectedKecamatan === kecamatanName || selectedKecamatan === 'Semua Kecamatan';
    
    // Generate warna berdasarkan nama kecamatan untuk konsistensi
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
      '#A3E4D7', '#FAD7A0', '#D5A6BD', '#AED6F1', '#A9DFBF',
      '#F9E79F', '#D2B4DE', '#A6E3E9'
    ];
    const colorIndex = kecamatanName ? Math.abs(kecamatanName.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % colors.length : 0;
    
    return {
      fillColor: isSelected ? colors[colorIndex] : '#E5E7EB',
      weight: isSelected ? 2 : 1,
      opacity: isSelected ? 1 : 0.5,
      color: isSelected ? '#2C3E50' : '#9CA3AF',
      dashArray: '',
      fillOpacity: isSelected ? 0.4 : 0.1
    };
  };

  const kabupatenStyle = {
    fillColor: 'transparent',
    weight: 3,
    opacity: 1,
    color: '#1D4ED8',
    dashArray: '5, 5',
    fillOpacity: 0
  };

  // Handler untuk boundaries events
  const onEachKecamatan = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties;
    if (props && props.KECAMATAN) {
      // Popup dengan informasi kecamatan
      (layer as L.Layer & { bindPopup: (content: string) => void }).bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-lg">${props.KECAMATAN}</h3>
        </div>
      `);
      
      // Hover effects
      (layer as L.Layer & { on: (events: Record<string, (e: LayerEvent) => void>) => void }).on({
        mouseover: function (e: LayerEvent) {
          const layer = e.target;
          layer.setStyle({
            weight: 4,
            fillOpacity: 0.6
          });
        },
        mouseout: function (e: LayerEvent) {
          const layer = e.target;
          layer.setStyle(getKecamatanStyle(feature) as Record<string, unknown>);
        }
      });
    }
  };

  const onEachKabupaten = (feature: GeoJSON.Feature, layer: L.Layer) => {
    if (feature.properties && feature.properties.name) {
      (layer as L.Layer & { bindPopup: (content: string) => void }).bindPopup(`<strong>Kabupaten ${feature.properties.name}</strong>`);
    }
  };

  // Note: handleScreenshot function removed as it was unused

  return (
    <div className="w-full h-full flex flex-col" style={{ height: '100%' }}>
      {/* Map content - all filters now handled by FilterControls in parent */}
      
      {/* Loading */}
      {!mapReady ? (
        <div className="flex items-center justify-center h-full text-gray-600">
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Memuat peta...</span>
          </div>
        </div>
      ) : validReports.length === 0 ? (
        <div className="h-full" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="bg-white border border-gray-300 shadow-md px-4 py-2 rounded text-sm text-gray-700 text-center">
            Tidak ada laporan ditemukan untuk filter ini.
          </div>
        </div>
      ) : (
        <div
          ref={mapParentRef}
          className="h-full"
          style={{ position: 'relative' }}
        >
          <MapContainer
            key="map-container"
            center={mapCenter}
            zoom={10}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <Legend />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Boundaries Kabupaten dan Kecamatan */}
            {showBoundaries && boundariesData && (
              <>
                {/* Kecamatan Boundaries - Data GeoJSON dari API */}
                {boundariesData.kecamatan && (
                  <GeoJSON
                    key={`kecamatan-boundaries-${selectedKecamatan}`} // Re-render saat kecamatan berubah
                    data={boundariesData.kecamatan}
                    style={getKecamatanStyle}
                    onEachFeature={onEachKecamatan}
                  />
                )}
                {/* Kabupaten Boundaries - Jika ada data terpisah */}
                {boundariesData.kabupaten && (
                  <GeoJSON
                    key="kabupaten-boundaries"
                    data={boundariesData.kabupaten}
                    style={kabupatenStyle}
                    onEachFeature={onEachKabupaten}
                  />
                )}
              </>
            )}
            
            {/* Marker per laporan valid */}
            {validReports.map(r => {
              const lat = r.location.latitude;
              const lon = r.location.longitude;
              const status = r.tindakan?.status || 'Perlu Verifikasi';
              const icon = iconByStatus[status] || iconByStatus['Perlu Verifikasi'];
              return (
                <Marker key={r._id} position={[lat, lon]} icon={icon}>
                  <Popup>
                    <div>
                      <p>
                        <strong>Pesan:</strong>{" "}
                        {r.message && r.message.length > 100
                          ? (
                            <>
                              {r.message.slice(0, 100) + " ...."}
                            </>
                          )
                          : r.message
                        }
                      </p>
                      <p><strong>Lokasi:</strong> {r.location.description}</p>
                      {r.user?.name && <p><strong>Pelapor:</strong> {r.user.name}</p>}
                      <p><strong>Status:</strong> {status}</p>
                      <a
                        href={`/pengaduan/${r.sessionId}`}
                        // target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Klik untuk melihat detail laporan
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          
          {/* Boundaries Legend */}
          <BoundariesLegend
            kecamatanList={kecamatanList}
            selectedKecamatan={selectedKecamatan}
            onKecamatanSelect={setSelectedKecamatan}
            visible={showBoundaries}
          />
        </div>
      )}
    </div>
  );
}
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import axios from '../../../utils/axiosInstance';
import Legend from '../utils/legend';
import BoundariesLegend from '../widgets/BoundariesLegend';
import iconByStatus from '../utils/icons';
import { Report } from '../../../lib/types';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import { MdOutlineScreenshotMonitor } from "react-icons/md";

// Base URL dari API backend
const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

// Opsi filter berdasarkan waktu
const FILTERS = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

// Opsi status laporan yang bisa difilter
const STATUS_OPTIONS = [
  'Semua Status',
  'Perlu Verifikasi',
  'Verifikasi Situasi',
  'Verifikasi Kelengkapan Berkas',
  'Proses OPD Terkait',
  'Selesai Penanganan',
  'Selesai Pengaduan',
  'Ditutup',
];

// Label nama bulan
const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const now = dayjs();

interface MapPersebaranProps {
  isFullscreen?: boolean;
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
  isFullscreen = false,
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
  const [isScreenshotLoading, setIsScreenshotLoading] = useState(false);
  const [boundariesData, setBoundariesData] = useState<any>(null);
  const [boundariesLoading, setBoundariesLoadingInternal] = useState(false);
  const [kecamatanList, setKecamatanList] = useState<string[]>([]);

  // Use external setBoundariesLoading if provided, otherwise use internal
  const handleSetBoundariesLoading = setBoundariesLoading || setBoundariesLoadingInternal;

  // Daftar 5 tahun terakhir
  const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

  // Hitung jumlah minggu dalam satu bulan tertentu
  const getWeeksInMonth = (y: number, m: number) => {
    const first = dayjs(`${y}-${m}-01`);
    const end = first.endOf('month');
    let weekCount = 1;
    let cursor = first.startOf('week').add(1, 'day');
    while (cursor.isBefore(end)) {
      weekCount++;
      cursor = cursor.add(1, 'week');
    }
    return weekCount;
  };

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
    if (boundariesData || boundariesLoading) return; // Skip jika sudah ada data atau sedang loading
    
    handleSetBoundariesLoading(true);
    try {
      // Menggunakan API baru untuk mendapatkan data GeoJSON Kabupaten Bekasi
      const res = await axios.get(`${API_URL}/geojson/kabupaten-bekasi`);
      
      if (res.data.success) {
        // Set data boundaries dari response API
        setBoundariesData({
          kecamatan: res.data.data, // Data GeoJSON semua kecamatan
          kabupaten: null // Akan diisi jika ada data kabupaten terpisah
        });
        
        // Extract daftar kecamatan dari data GeoJSON
        if (res.data.meta && res.data.meta.kecamatan_list) {
          setKecamatanList(res.data.meta.kecamatan_list);
        } else if (res.data.data && res.data.data.features) {
          // Fallback jika meta tidak ada, extract dari features
          const kecamatanNames = res.data.data.features.map((feature: any) => 
            feature.properties.KECAMATAN
          ).filter((name: string) => name).sort();
          setKecamatanList([...new Set(kecamatanNames)] as string[]);
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
  }, [boundariesData, boundariesLoading]);

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

  // Export data CSV agregat lokasi dan status
  const handleDownloadCSV = () => {
    const summary: Record<string, { total: number; status: string }> = {};

    reports.forEach(r => {
      const status = r.tindakan?.status || 'Perlu Verifikasi';
      const kel = r.location.desa || '-';
      const kec = r.location.kecamatan || '-';
      const kab = r.location.kabupaten || '-';
      const key = `${kel},${kec},${kab},${status}`;
      summary[key] = summary[key] || { total: 0, status };
      summary[key].total++;
    });

    let csv = 'Kelurahan/Desa,Kecamatan,Kabupaten/Kota,Status,Total\n';
    Object.entries(summary).forEach(([key, val]) => {
      csv += `${key},${val.total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persebaran-${filter}-${year}${filter !== 'yearly' ? `-${month}` : ''}${filter === 'weekly' ? `-minggu${week}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
  const getKecamatanStyle = (feature: any) => {
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
  const onEachKecamatan = (feature: any, layer: any) => {
    const props = feature.properties;
    if (props && props.KECAMATAN) {
      // Popup dengan informasi kecamatan
      layer.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-lg">${props.KECAMATAN}</h3>
        </div>
      `);
      
      // Hover effects
      layer.on({
        mouseover: function (e: any) {
          const layer = e.target;
          layer.setStyle({
            weight: 4,
            fillOpacity: 0.6
          });
        },
        mouseout: function (e: any) {
          const layer = e.target;
          layer.setStyle(getKecamatanStyle(feature));
        }
      });
    }
  };

  const onEachKabupaten = (feature: any, layer: any) => {
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(`<strong>Kabupaten ${feature.properties.name}</strong>`);
    }
  };

  // Screenshot handler
  const handleScreenshot = async () => {
    if (!mapParentRef.current) return;
    try {
      setIsScreenshotLoading(true); // <-- set loading
      mapParentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const canvas = await html2canvas(mapParentRef.current, {
        useCORS: true,
        backgroundColor: "#fff",
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `screenshot-peta-${filter}-${year}${filter !== 'yearly' ? `-${month}` : ''}${filter === 'weekly' ? `-minggu${week}` : ''}.jpg`;
      link.click();
    } catch (err) { // eslint-disable-line @typescript-eslint/no-unused-vars
      alert('Gagal mengambil screenshot. Silakan coba lagi!');
    } finally {
      setIsScreenshotLoading(false); // <-- reset loading
    }
  };

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
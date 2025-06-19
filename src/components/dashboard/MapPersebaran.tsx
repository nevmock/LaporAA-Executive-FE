'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from '../../utils/axiosInstance';
import Legend from './legend';
import iconByStatus from './icons';
import { Report } from '../../lib/types';
import dayjs from 'dayjs';

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
  'Semua',
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

// Komponen utama Peta Persebaran Laporan
export default function MapPersebaran({ isFullscreen = false }: { isFullscreen?: boolean }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState('monthly');
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);
  const [week, setWeek] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [mapReady, setMapReady] = useState(false);

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
  const fetchData = async () => {
    setMapReady(false);
    let url = `${API_URL}/dashboard/map?mode=${filter}&year=${year}`;
    if (filter !== 'yearly') url += `&month=${month}`;
    if (filter === 'weekly') url += `&week=${week}`;
    if (selectedStatus !== 'Semua') url += `&status=${encodeURIComponent(selectedStatus)}`;
    try {
      const res = await axios.get(url);
      setReports(res.data.data || []);
    } catch (err) {
      console.error('❌ Gagal ambil data:', err);
    } finally {
      setMapReady(true);
    }
  };

  // Trigger fetch data setiap kali filter berubah
  useEffect(() => {
    fetchData();
  }, [filter, year, month, week, selectedStatus]);

  // Reset minggu ke-1 saat bulan/tahun/filter berubah
  useEffect(() => {
    setWeek(1);
  }, [month, year, filter]);

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

  // Tentukan pusat peta dari laporan pertama yang valid (berkoordinat)
  const firstValid = reports.find(r => r.location?.latitude && r.location?.longitude);
  const mapCenter: [number, number] = firstValid
    ? [firstValid.location.latitude, firstValid.location.longitude]
    : [-2.5, 118]; // Default: tengah Indonesia

  return (
    <div className="w-full h-full flex flex-col">
      {/* Filter dan kontrol */}
      <div className="flex flex-wrap gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800">Peta Persebaran</h4>
        <div className="flex flex-wrap gap-2 items-center justify-end mt-5">
          {/* Dropdown filter */}
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
            {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={year} onChange={e => setYear(+e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {(filter === 'monthly' || filter === 'weekly') && (
            <select value={month} onChange={e => setMonth(+e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
              {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          )}
          {filter === 'weekly' && (
            <select value={week} onChange={e => setWeek(+e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
              {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Minggu ke-{w}</option>
              ))}
            </select>
          )}
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {/* Tombol download CSV */}
          <button onClick={handleDownloadCSV} className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600">
            Download CSV
          </button>
        </div>
      </div>

      {/* Peta */}
      <div className={isFullscreen ? 'h-[calc(100%-60px)]' : 'h-[400px]'}>
        {mapReady ? (
          <MapContainer
            key={isFullscreen ? 'fullscreen' : 'normal'}
            center={mapCenter}
            zoom={isFullscreen ? 11 : 10}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <Legend />
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Marker per laporan */}
            {reports.map(r => {
              const lat = r.location.latitude;
              const lon = r.location.longitude;
              const status = r.tindakan?.status || 'Perlu Verifikasi';
              const icon = iconByStatus[status] || iconByStatus['Perlu Verifikasi'];

              return (
                <Marker key={r._id} position={[lat, lon]} icon={icon}>
                  <Popup>
                    <div>
                      <p><strong>Pesan:</strong> {r.message}</p>
                      <p><strong>Lokasi:</strong> {r.location.description}</p>
                      {r.user?.name && <p><strong>Pelapor:</strong> {r.user.name}</p>}
                      <p><strong>Status:</strong> {status}</p>
                      <a
                        href={`/pengaduan/${r.sessionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Klik untuk melihat laporan
                      </a>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {/* Tidak ada data */}
            {reports.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
                <div className="bg-white border border-gray-300 shadow-md px-4 py-2 rounded text-sm text-gray-700 text-center">
                  Tidak ada laporan ditemukan untuk filter ini.
                </div>
              </div>
            )}
          </MapContainer>
        ) : (
          // Loading state
          <div className="flex items-center justify-center h-full text-gray-600">
            <div className="flex flex-col items-center gap-2 animate-pulse">
              <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm">Memuat peta...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
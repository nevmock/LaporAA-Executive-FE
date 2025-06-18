'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from '../../../../utils/axiosInstance';
import Legend from './legend';
import iconByStatus from './icons';
import { Report } from '../../../../lib/types';
import dayjs from 'dayjs';

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const FILTERS = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const STATUS_OPTIONS = [
  'Semua',
  'Perlu Verifikasi',
  'Verifikasi Situasi',
  'Verifikasi Kelengkapan Berkas',
  'Proses OPD Terkait',
  'Selesai Penanganan',
  'Selesai Pengaduan',
  'Ditolak',
];

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const now = dayjs();

export default function MapPersebaran({ isFullscreen = false }: { isFullscreen?: boolean }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState('monthly');
  const [year, setYear] = useState(now.year());
  const [month, setMonth] = useState(now.month() + 1);
  const [week, setWeek] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [mapReady, setMapReady] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

  const getWeeksInMonth = (year: number, month: number) => {
    const firstDay = dayjs(`${year}-${month}-01`);
    const lastDay = firstDay.endOf('month');
    let week = 1;
    let current = firstDay.startOf('week').add(1, 'day');
    while (current.isBefore(lastDay)) {
      week++;
      current = current.add(1, 'week');
    }
    return week;
  };

  useEffect(() => {
    setMapReady(false);
    let url = `${API_URL}/dashboard/map?mode=${filter}&year=${year}`;
    if (filter === 'monthly' || filter === 'weekly') url += `&month=${month}`;
    if (filter === 'weekly') url += `&week=${week}`;
    if (selectedStatus !== 'Semua') url += `&status=${encodeURIComponent(selectedStatus)}`;

    axios
      .get(url)
      .then((res) => {
        setReports(res.data.data || []);
        setMapReady(true);
      })
      .catch((err) => {
        console.error('❌ Gagal ambil data laporan:', err);
        setMapReady(true);
      });
  }, [filter, year, month, week, selectedStatus]);

  useEffect(() => {
    setWeek(1);
  }, [month, year, filter]);

  const handleDownloadCSV = () => {
    const summaryMap: Record<string, { total: number; status: string }> = {};

    for (const r of reports) {
      const status = r.tindakan?.status || 'Perlu Verifikasi';
      const kel = r.location.desa || '-';
      const kec = r.location.kecamatan || '-';
      const kab = r.location.kabupaten || '-';
      const key = `${kel},${kec},${kab},${status}`;

      if (!summaryMap[key]) summaryMap[key] = { total: 0, status };
      summaryMap[key].total++;
    }

    let csv = 'Kelurahan/Desa,Kecamatan,Kabupaten/Kota,Status,Total\n';
    Object.entries(summaryMap).forEach(([key, { total, status }]) => {
      const [kel, kec, kab] = key.split(',');
      csv += `"${kel}","${kec}","${kab}","${status}",${total}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persebaran-${filter}-${year}${filter !== 'yearly' ? `-${month}` : ''}${filter === 'weekly' ? `-minggu${week}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const firstMarker = reports.find(r => typeof r?.location?.latitude === 'number' && typeof r?.location?.longitude === 'number');
  const mapCenter: [number, number] = firstMarker
    ? [firstMarker.location.latitude, firstMarker.location.longitude]
    : [-2.5, 118];

  return (
    <div className="w-full h-full flex flex-col">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-800">Peta Persebaran</h4>
        <div className="flex flex-wrap gap-2 items-center justify-end mt-5">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
            {FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {(filter === 'monthly' || filter === 'weekly') && (
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
              {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          )}
          {filter === 'weekly' && (
            <select value={week} onChange={(e) => setWeek(Number(e.target.value))} className="border rounded px-2 py-1 text-sm text-black">
              {Array.from({ length: getWeeksInMonth(year, month) }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>Minggu ke-{w}</option>
              ))}
            </select>
          )}
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="border rounded px-2 py-1 text-sm text-black">
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleDownloadCSV} className="border rounded px-2 py-1 text-sm bg-green-500 text-white hover:bg-green-600">
            Download CSV
          </button>
        </div>
      </div>

      {/* Map */}
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

            {reports.map((report) => {
              const lat = report.location.latitude;
              const lon = report.location.longitude;
              const status = report.tindakan?.status || 'Perlu Verifikasi';
              const icon = iconByStatus[status] || iconByStatus['Perlu Verifikasi'];

              return (
                <Marker key={report._id} position={[lat, lon]} icon={icon}>
                  <Popup>
                    <div>
                      <p><strong>Pesan:</strong> {report.message}</p>
                      <p><strong>Lokasi:</strong> {report.location.description}</p>
                      {report.user?.name && <p><strong>Pelapor:</strong> {report.user.name}</p>}
                      <p><strong>Status:</strong> {status}</p>
                      <p>
                        <a
                          href={`/pengaduan/${report.sessionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Klik untuk melihat laporan
                        </a>
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {reports.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[999]">
                <div className="bg-white border border-gray-300 shadow-md px-4 py-2 rounded text-sm text-gray-700 text-center">
                  Tidak ada laporan ditemukan untuk filter ini.
                </div>
              </div>
            )}
          </MapContainer>
        ) : (
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
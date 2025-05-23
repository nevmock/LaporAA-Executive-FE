'use client';
import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Report {
  _id: string;
  sessionId: string;
  message: string;
  location: {
    latitude: number;
    longitude: number;
    description: string;
    desa?: string;
    kecamatan?: string;
    kabupaten?: string;
  };
  user?: {
    name: string;
  };
  photos?: string[];
  tindakan?: {
    situasi?: string;
  };
}

// ICONS per situasi
const iconBySituasi: Record<string, L.Icon> = {
  'Darurat': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Permintaan Informasi': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Berpengawasan': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'Tidak Berpengawasan': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  }),
  'default': L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  }),
};

export default function MapPersebaran() {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/reports`)
      .then((res) => setReports(res.data.data || []))
      .catch((err) => {
        console.error('❌ Gagal ambil data laporan:', err);
      });
  }, []);

  const mapCenter = useMemo<[number, number]>(() => {
    const filtered = reports.filter(
      (r) => r?.location?.latitude && r?.location?.longitude
    );
    if (filtered.length === 0) return [0, 0];

    const avgLat = filtered.reduce((sum, r) => sum + r.location.latitude, 0) / filtered.length;
    const avgLon = filtered.reduce((sum, r) => sum + r.location.longitude, 0) / filtered.length;

    return [avgLat, avgLon];
  }, [reports]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow">
      {reports.length > 0 ? (
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Legend Warna */}
          <div className="absolute bottom-4 text-gray-800 right-4 bg-white bg-opacity-50 rounded shadow p-3 text-sm z-[1000]">
            {/* <h4 className="font-semibold mb-2">Keterangan Situasi</h4> */}
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-3 h-5 inline-block rounded-sm bg-red-600" /> Darurat
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-5 inline-block rounded-sm bg-gray-600" /> Permintaan Informasi
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-5 inline-block rounded-sm bg-green-600" /> Berpengawasan
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-5 inline-block rounded-sm bg-yellow-400" /> Tidak Berpengawasan
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-5 inline-block rounded-sm bg-blue-400" /> Belum Diverifikasi
              </li>
            </ul>
          </div>
          <TileLayer
            attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {reports.map((report) => {
            const situasi = report.tindakan?.situasi || '';
            const icon = iconBySituasi[situasi] || iconBySituasi.default;

            return (
              <Marker
                key={report._id}
                position={[report.location.latitude, report.location.longitude]}
                icon={icon}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Situasi:</strong> {report.tindakan?.situasi || 'Tidak diketahui'}
                    <br />
                    <strong>Session:</strong> {report.sessionId}
                    <br />
                    <strong>Pelapor:</strong> {report.user?.name || 'Tidak diketahui'}
                    <br />
                    <strong>Pesan:</strong> {report.message}
                    <br />
                    <strong>Lokasi:</strong> {report.location.description}
                    <br />
                    <strong>Desa:</strong> {report.location.desa}
                    <br />
                    <strong>Kecamatan:</strong> {report.location.kecamatan}
                    <br />
                    <strong>Kabupaten:</strong> {report.location.kabupaten}
                    <br />
                    {report.photos && report.photos.length > 0 && (
                      <div className="mt-2">
                        {report.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={`${API_URL}${photo}`}
                            alt={`Foto ${index + 1}`}
                            className="w-32 h-20 object-cover mb-1 rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      ) : (
        <div className="p-6 text-center text-gray-500">Sedang memuat peta...</div>
      )}
    </div>
  );
}
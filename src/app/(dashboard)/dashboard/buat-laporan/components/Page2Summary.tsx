import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';

const Page2Summary: React.FC = () => {
  return (
    <ReportPageWrapper pageNumber={2}>
      {/* Page Title */}
      <div 
        className="font-bold text-center mb-6"
        style={{ 
          fontSize: '28px', 
          lineHeight: '32px',
          color: 'rgb(196,32,32)',
          marginTop: '20px'
        }}
      >
        RINGKASAN STATISTIK
      </div>

      {/* Agency Name */}
      <div 
        className="text-center text-black font-normal mb-4"
        style={{
          fontSize: '18px',
          lineHeight: '22px'
        }}
      >
        [NAMA INSTANSI]
      </div>

      {/* Periode */}
      <div 
        className="text-center text-black font-normal mb-8"
        style={{
          fontSize: '16px',
          lineHeight: '20px'
        }}
      >
        [PERIODE] - [BULAN TAHUN]
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Total Laporan Masuk */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-blue-600 text-sm font-medium mb-2">Total Laporan Masuk</div>
          <div className="text-blue-800 text-3xl font-bold">[XXX]</div>
          <div className="text-green-600 text-xs mt-1">↑ [%]</div>
        </div>

        {/* Total Ditindaklanjuti */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-green-600 text-sm font-medium mb-2">Total Ditindaklanjuti</div>
          <div className="text-green-800 text-3xl font-bold">[XXX]</div>
          <div className="text-green-600 text-xs mt-1">↑ [%]</div>
        </div>

        {/* Perlu Verifikasi */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-yellow-600 text-sm font-medium mb-2">Perlu Verifikasi</div>
          <div className="text-yellow-800 text-3xl font-bold">[XXX]</div>
          <div className="text-red-600 text-xs mt-1">↓ [%]</div>
        </div>
      </div>

      {/* Status Detail Cards Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {/* Verifikasi Situasi */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <div className="text-orange-600 text-xs font-medium mb-1">Verifikasi Situasi</div>
          <div className="text-orange-800 text-xl font-bold">[XX]</div>
        </div>

        {/* Verifikasi Kelengkapan */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
          <div className="text-purple-600 text-xs font-medium mb-1">Verifikasi Kelengkapan</div>
          <div className="text-purple-800 text-xl font-bold">[XX]</div>
        </div>

        {/* Proses OPD */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
          <div className="text-indigo-600 text-xs font-medium mb-1">Proses OPD Terkait</div>
          <div className="text-indigo-800 text-xl font-bold">[XXX]</div>
        </div>

        {/* Selesai Penanganan */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
          <div className="text-teal-600 text-xs font-medium mb-1">Selesai Penanganan</div>
          <div className="text-teal-800 text-xl font-bold">[XXX]</div>
        </div>
      </div>

      {/* Final Status Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Selesai Pengaduan */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <div className="text-emerald-600 text-xs font-medium mb-1">Selesai Pengaduan</div>
          <div className="text-emerald-800 text-lg font-bold">[XXX]</div>
        </div>

        {/* Ditutup */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-gray-600 text-xs font-medium mb-1">Ditutup</div>
          <div className="text-gray-800 text-lg font-bold">[XX]</div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="absolute bottom-6 right-6 text-black font-normal"
        style={{
          fontSize: '12px',
          lineHeight: '14px'
        }}
      >
        *Data Per [TANGGAL] | [WAKTU]
      </div>
    </ReportPageWrapper>
  );
};

export default Page2Summary;

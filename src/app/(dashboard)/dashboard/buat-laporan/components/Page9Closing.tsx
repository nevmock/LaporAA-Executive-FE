import React from 'react';
import ReportPageWrapper from './ReportPageWrapper';

const Page9Closing: React.FC = () => {
  return (
    <ReportPageWrapper pageNumber={9}>
      {/* Page Title */}
      <div className="font-bold text-center mb-6" style={{ fontSize: '28px', lineHeight: '32px', color: 'rgb(196,32,32)', marginTop: '30px' }}>
        PENUTUP
      </div>
      {/* Main Content */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Conclusion Section */}
        <div className="bg-white/80 p-6 rounded-lg border-l-4 border-red-600">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Kesimpulan</h3>
          <div className="text-gray-700 space-y-3" style={{ fontSize: '14px', lineHeight: '20px' }}>
            <p>Berdasarkan data laporan yang telah disampaikan pada periode ini, dapat disimpulkan bahwa:</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Tingkat respons masyarakat terhadap layanan Lapor AA mengalami peningkatan</li>
              <li>Kategori laporan infrastruktur masih mendominasi dengan 45% dari total laporan</li>
              <li>Tingkat kepuasan masyarakat mencapai 87% dengan mayoritas memberikan rating sangat baik</li>
              <li>Waktu respon rata-rata penanganan laporan adalah 2.3 hari</li>
            </ul>
          </div>
        </div>
        {/* Recommendation Section */}
        <div className="bg-white/80 p-6 rounded-lg border-l-4 border-blue-600">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Rekomendasi</h3>
          <div className="text-gray-700 space-y-3" style={{ fontSize: '14px', lineHeight: '20px' }}>
            <ul className="list-disc ml-6 space-y-2">
              <li>Peningkatan kapasitas infrastruktur untuk mengatasi volume laporan yang tinggi</li>
              <li>Optimalisasi sistem notifikasi untuk mempercepat respons laporan</li>
              <li>Pengembangan fitur tracking real-time untuk meningkatkan transparansi</li>
              <li>Pelatihan berkelanjutan untuk petugas penanganan laporan</li>
            </ul>
          </div>
        </div>
        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-gray-300">
          <div className="text-gray-600" style={{ fontSize: '12px' }}>
            <p className="font-semibold">Terima kasih atas perhatian dan dukungan Bapak/Ibu</p>
            <p className="mt-2">Dinas Komunikasi dan Informatika</p>
            <p>Kabupaten Asahan</p>
          </div>
        </div>
      </div>
    </ReportPageWrapper>
  );
};

export default Page9Closing;

import Link from 'next/link'
 
export default function Custom404() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-6">
          Halaman yang Anda cari tidak ditemukan atau telah dipindahkan.
        </p>
        <Link href="/" className="inline-block px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}

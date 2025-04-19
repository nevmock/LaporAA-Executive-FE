"use client";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Selamat datang 👋</h1>
      <p className="text-gray-600 mb-6">Silakan masuk ke dashboard untuk melihat data laporan.</p>
      <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Masuk ke Dashboard
      </Link>
    </div>
  );
}

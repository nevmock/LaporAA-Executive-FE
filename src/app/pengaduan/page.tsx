"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import PengaduanTable from "./components/pengaduanTable";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Chat {
  _id: string[]; // Sesuai dengan MongoDB ObjectId
  sessionId: string; // Ditambahkan dari skema
  from: string; // Ditambahkan dari skema
  user: string[]; // Mengacu pada ObjectId dari UserProfile
  address: string; // Ditambahkan dari skema
  location: string; // Ditambahkan dari skema
  message: string; // Ditambahkan dari skema
  photos: string[]; // URL foto, default array kosong
  status: "in_progress" | "done" | "rejected"; // Enum status
  createdAt?: string; // Ditambahkan karena timestamps
  updatedAt?: string; // Ditambahkan karena timestamps
}

export default function PengaduanPage() {
  const [data, setData] = useState<Chat[]>([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/reports`)
      .then((res) => {
        const responseData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const processedData = responseData.map((item: any) => ({
          ...item,
          user: typeof item.user === "object" ? item.user.name : item.user,
          nik: typeof item.user === "object" ? item.user.nik : item.user,
          address: typeof item.user === "object" ? item.user.address : item.user,
          reportHistory: typeof item.user === "object" ? item.user.reportHistory : item.user,
        }));
        setData(processedData);
        console.log("✅ fetched data:", processedData);
      })
      .catch((err) => {
        console.error("❌ fetch error:", err);
        setData([]);
      });
  }, []);

  return (
    <div className="w-full h-screen bg-white p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Daftar Pengaduan</h2>

      {Array.isArray(data) && data.length > 0 ? (
        <PengaduanTable data={data} />
      ) : (
        <p className="text-gray-500">Tidak ada laporan.</p>
      )}
    </div>
  );
}
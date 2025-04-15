"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import PengaduanTable from "./components/pengaduanTable";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Chat {
  _id: string;
  senderName: string;
  senderPhone?: string;
  senderAddress?: string;
  date?: string;
  priority?: string;
  situation?: string;
  status?: string;
  relatedDepartments?: string[]; // array OPD
}

export default function PengaduanPage() {
  const [data, setData] = useState<Chat[]>([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/chat`)
      .then((res) => {
        const responseData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setData(responseData);
        console.log("✅ fetched data:", responseData);
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

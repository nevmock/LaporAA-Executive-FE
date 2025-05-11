"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import PengaduanTable from "./components/pengaduanTable";
import { Tindakan, Location, Chat  } from "../../../lib/types";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function PengaduanPage() {
  const [data, setData] = useState<Chat[]>([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/reports`)
      .then((res) => {
        const responseData = Array.isArray(res.data) ? res.data : res.data?.data || [];

        // Transform user object (jika masih object) jadi string name
        const processedData: Chat[] = responseData.map((item: any) => ({
          ...item,
          user: typeof item.user === "object" ? item.user.name : item.user,
          address: typeof item.user === "object" ? item.user.address : item.address,
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

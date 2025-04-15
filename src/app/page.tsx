"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Chat {
  _id: string;
  senderName: string;
}

export default function Home() {
  const [data, setData] = useState<Chat[]>([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/chat`)
      .then((res) => {
        // Pastikan isi dari res.data itu array
        const responseData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setData(responseData);
        console.log("✅ res.data:", res.data);
      })
      .catch((err) => {
        console.error(err);
        setData([]); // fallback safe
      });
  }, []);

  return (
    <div className="w-1/3 h-screen bg-white p-6 border-r overflow-y-auto shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Daftar Laporan</h2>
      {Array.isArray(data) && data.length > 0 ? (
        data.map((chat) => (
          <Link
            key={chat._id}
            href={`/${chat._id}`}
            className="block p-4 mb-2 rounded-lg shadow-md bg-white hover:bg-gray-100 transition border border-gray-300"
          >
            <p className="font-semibold text-lg text-gray-800">{chat.senderName}</p>
            <p className="text-sm text-gray-600">{chat._id}</p>
          </Link>
        ))
      ) : (
        <p className="text-gray-500">Tidak ada laporan.</p>
      )}
    </div>
  );
}

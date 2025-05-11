"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import PengaduanTable from "./components/pengaduanTable";
import { Tindakan, Location, Chat  } from "../../../lib/types";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function PengaduanPage() {
  return (
    <div className="w-full h-screen bg-white p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Daftar Pengaduan</h2>

        <PengaduanTable />
      {/*{Array.isArray(data) && data.length > 0 ? (*/}
      {/*) : (*/}
      {/*  <p className="text-gray-500">Tidak ada laporan.</p>*/}
      {/*)}*/}
    </div>
  );
}

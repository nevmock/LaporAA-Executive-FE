"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const Laporan = dynamic(() => import("../../../components/pengaduan/laporan"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function PengaduanPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="w-full h-full">
      <Laporan />
    </div>
  );
}

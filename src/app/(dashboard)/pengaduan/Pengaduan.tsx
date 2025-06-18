"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Laporan from "./components/laporan";

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

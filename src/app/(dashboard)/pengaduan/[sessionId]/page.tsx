"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Message from "./components/message";
import Tindakan from "./components/tindakan";
import { Data } from "../../../../lib/types";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function ChatPage() {
  const params = useParams() as { sessionId?: string };
  const sessionId = params?.sessionId;
  const router = useRouter();
  const pathname = usePathname();

  const [data, setData] = useState<Data | null>(null);
  const [activeTab, setActiveTab] = useState<"pesan" | "tindakan">("tindakan");

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports/${sessionId}`);
      setData(res.data);
    } catch (err) {
      console.error("❌ Gagal ambil data:", err);
      setData(null);
    }
  };

  useEffect(() => {
    if (sessionId) fetchData();
  }, [sessionId]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    console.info("data role:", role);

    if (!data?.from || role !== "Bupati") return;

    const handleUnload = () => {
      navigator.sendBeacon(
        `${API_URL}/user/user-mode/${data.from}`,
        JSON.stringify({ mode: "bot" })
      );
    };

    // Set manual saat buka tab pesan
    if (activeTab === "pesan") {
      axios.patch(`${API_URL}/user/user-mode/${data.from}`, { mode: "manual" })
        .catch((err) => console.error("❌ Gagal ubah ke manual:", err));
    }

    // Kembalikan ke bot saat navigasi halaman (bukan cuma tab)
    const handlePathChange = () => {
      if (data?.from) {
        axios.patch(`${API_URL}/user/user-mode/${data.from}`, { mode: "bot" })
          .catch((err) => console.error("❌ Gagal reset ke bot saat pindah halaman:", err));
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      handlePathChange(); // saat unmount
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [activeTab, data?.from, pathname]);

  if (!sessionId) return null;

  return (
    <div className="w-full h-screen flex bg-white">
      {/* Left section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b bg-gray-100 justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/pengaduan")}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div>
              <p className="font-semibold text-gray-800">{data?.user?.name}</p>
              <p className="text-sm text-gray-500">+{data?.from}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 bg-white">
          {["tindakan", "pesan"].map((tab) => (
            <button
              key={tab}
              className={`py-2 px-4 font-medium ${activeTab === tab ? "border-b-2 border-gray-800 text-gray-800" : "text-gray-500"}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "pesan" ? (
            <Message from={data?.from || ""} />
          ) : (
            <Tindakan tindakan={data?.tindakan || null} sessionId={sessionId} />
          )}
        </div>
      </div>
    </div>
  );
}
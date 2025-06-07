"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Message from "./components/message";
import Tindakan from "./components/tindakan";
import { Data } from "../../../../lib/types";
import axios from "../../../../utils/axiosInstance";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function ChatPage() {
  const params = useParams() as { sessionId?: string };
  const sessionId = params?.sessionId;
  const router = useRouter();

  const [data, setData] = useState<Data | null>(null);
  const [activeTab, setActiveTab] = useState<"pesan" | "tindakan">("tindakan");
  const [modeReady, setModeReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports/${sessionId}`);
      setData(res.data);
    } catch (err) {
      console.error("❌ Gagal ambil data:", err);
    }
  };

  // Saat sessionId berubah, ambil ulang data
  useEffect(() => {
    if (sessionId) fetchData();
  }, [sessionId]);

  // Fungsi untuk set mode hanya jika perlu
  const ensureMode = async (from: string, target: "manual" | "bot") => {
    let retry = 0;

    while (retry < 5) {
      try {
        const check = await axios.get(`${API_URL}/user/user-mode/${from}`);
        const current = check.data?.mode || check.data?.session?.mode;

        if (current === target) {
          console.log(`✅ Mode sudah sesuai: ${current}`);
          if (target === "manual") setModeReady(true);
          return;
        }

        // Patch jika belum sesuai
        await axios.patch(`${API_URL}/user/user-mode/${from}`, { mode: target });
        console.log(`✅ Mode berhasil diubah ke: ${target}`);
        await new Promise((r) => setTimeout(r, 300)); // tunggu sebentar
        retry++;
      } catch (err) {
        console.warn(`❌ Gagal patch mode ke ${target}, retry ke-${retry + 1}`);
        retry++;
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    console.error(`❌ Gagal set mode ${target} setelah 5 percobaan`);
    if (target === "manual") setModeReady(false);
  };

  // Handle mode berdasarkan tab
  useEffect(() => {
    if (!data?.from) return;

    const from = data.from;

    if (activeTab === "pesan") {
      setModeReady(false);
      ensureMode(from, "manual");
    } else {
      ensureMode(from, "bot");
    }

    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${API_URL}/user/user-mode/${from}`,
        JSON.stringify({ mode: "bot" })
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      ensureMode(from, "bot");
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeTab, data?.from]);

  if (!sessionId) return null;

  return (
    <div className="w-full h-screen flex bg-white">
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
              onClick={() => setActiveTab(tab as "pesan" | "tindakan")}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "pesan" ? (
            modeReady ? (
              <Message from={data?.from || ""} />
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                Menyiapkan mode manual...
              </div>
            )
          ) : (
            <Tindakan tindakan={data?.tindakan || null} sessionId={sessionId} />
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaWhatsapp } from "react-icons/fa";
import { Data } from "../../../../lib/types";
import axios from "../../../../utils/axiosInstance";

// Import loading component
const LoadingPage = dynamic(() => import("../../../../components/LoadingPage"), {
  ssr: false,
});

// Dynamic imports with LoadingPage
const Message = dynamic(() => import("../../../../components/pengaduan/laporan/message"), {
  loading: () => <LoadingPage />,
  ssr: false,
});

const Tindakan = dynamic(() => import("../../../../components/pengaduan/laporan/tindakan"), {
  loading: () => <LoadingPage />,
  ssr: false,
});

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

  useEffect(() => {
    if (sessionId) fetchData();
  }, [sessionId]);

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

        await axios.patch(`${API_URL}/user/user-mode/${from}`, { mode: target });
        console.log(`✅ Mode berhasil diubah ke: ${target}`);
        await new Promise((r) => setTimeout(r, 300));
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                className="w-6 h-6 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5" />
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
              className={`py-2 px-4 font-medium flex items-center gap-2 transition
              ${activeTab === tab
                  ? tab === "pesan"
                    ? "border-b-2 border-green-600 text-green-600 bg-green-50"
                    : "border-b-2 border-gray-800 text-gray-800 bg-gray-100"
                  : tab === "pesan"
                    ? "text-green-600 bg-green-100 hover:bg-green-50"
                    : "text-gray-500 bg-gray-50 hover:bg-gray-100"
                }`}
              onClick={() => setActiveTab(tab as "pesan" | "tindakan")}
            >
              {tab === "pesan" && <FaWhatsapp className="text-lg" />}
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
              <LoadingPage />
            )
          ) : (
            <Tindakan tindakan={data?.tindakan || null} sessionId={sessionId} />
          )}
        </div>
      </div>
    </div>
  );
}
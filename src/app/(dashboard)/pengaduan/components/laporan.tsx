"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "../../../../utils/axiosInstance";
import dynamic from "next/dynamic";
import { Chat, SortKey } from "../../../../lib/types";
import HeaderSection from "./headerSection";
import TableSection from "./tableSection";
import Pagination from "./pagination";
import PhotoModal from "./PhotoModal";

const MapModal = dynamic(() => import("./MapModal"), { ssr: false });

const statusOrder = [
  "Perlu Verifikasi",
  "Verifikasi Situasi",
  "Verifikasi Kelengkapan Berkas",
  "Proses OPD Terkait",
  "Selesai Penanganan",
  "Selesai Pengaduan",
  "Ditolak",
];

export default function Laporan() {
  const [data, setData] = useState<Chat[]>([]);
  const [search, setSearch] = useState("");
  const [sorts, setSorts] = useState<{ key: SortKey; order: "asc" | "desc" }[]>([
    { key: "prioritas", order: "desc" },
    { key: "date", order: "desc" },
  ]);
  const [selectedLoc, setSelectedLoc] = useState<{
    lat: number;
    lon: number;
    desa: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
  const [limit, setLimit] = useState(100);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [photoModal, setPhotoModal] = useState<string[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);

  const getReports = async (
    statusParam = selectedStatus,
    pageParam = page,
    limitParam = limit,
    searchParam = search
  ) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports`, {
        params: {
          page: pageParam,
          limit: limitParam,
          status: statusParam !== "Semua" ? statusParam : undefined,
          search: searchParam?.trim() || undefined,
          sorts: JSON.stringify(sorts),
        },
      });

      const responseData = Array.isArray(res.data?.data) ? res.data.data : [];
      const processedData: Chat[] = responseData.map((item: any) => ({
        ...item,
        user: typeof item.user === "object" ? item.user.name : item.user,
        address: typeof item.user === "object" ? item.user.address : item.address,
      }));

      setData(processedData);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setData([]);
    }
  };

  const getSummary = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports/summary`);
      setStatusCounts(res.data || {});
    } catch (err) {
      console.error("❌ Failed to fetch summary:", err);
      setStatusCounts({});
    }
  };

  const filteredData = useMemo(() => {
    return [...data].sort((a, b) => {
      for (const { key, order } of sorts) {
        let valA: any = "", valB: any = "";

        if (key === "prioritas") {
          valA = a.tindakan?.prioritas === "Ya" ? 1 : 0;
          valB = b.tindakan?.prioritas === "Ya" ? 1 : 0;
        } else if (key === "status") {
          valA = statusOrder.indexOf(a.tindakan?.status || "");
          valB = statusOrder.indexOf(b.tindakan?.status || "");
        } else if (key === "situasi") {
          valA = a.tindakan?.situasi || "";
          valB = b.tindakan?.situasi || "";
        } else if (key === "lokasi_kejadian") {
          valA = a.location?.desa || "";
          valB = b.location?.desa || "";
        } else if (key === "opd") {
          valA = a.tindakan?.opd || "";
          valB = b.tindakan?.opd || "";
        } else if (key === "timer" || key === "date") {
          valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        } else {
          valA = (a as any)[key] || "";
          valB = (b as any)[key] || "";
        }

        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sorts]);

  const allSelected = filteredData.length > 0 && selectedIds.length === filteredData.length;

  const toggleSingleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredData.map((chat) => chat.sessionId));
    }
  };

  const toggleMode = async (tindakanId: string, prioritas: boolean) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/tindakan/${tindakanId}/prioritas`, {
        prioritas: prioritas ? "Ya" : "-",
      });
      await getReports();
    } catch (err) {
      console.error("Gagal ubah mode:", err);
    }
  };

  const toggleSort = (key: SortKey) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (!existing) return [...prev, { key, order: "asc" }];
      if (existing.order === "asc")
        return prev.map((s) => (s.key === key ? { key, order: "desc" } : s));
      return prev.filter((s) => s.key !== key);
    });
  };

  const handleDeleteSelected = async () => {
    const confirm = window.confirm("Yakin ingin menghapus laporan yang dipilih?");
    if (!confirm) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports`, {
        data: { sessionIds: selectedIds },
      });
      setSelectedIds([]);
      await getReports();
      await getSummary();
    } catch (err) {
      console.error("❌ Gagal menghapus:", err);
      alert("Terjadi kesalahan saat menghapus laporan.");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role");
      setRole(storedRole);
    }
  }, []);

  useEffect(() => {
    getSummary();
  }, []);

  useEffect(() => {
    setPage(1);
    getReports(selectedStatus, 1, limit, search);
  }, [selectedStatus]);

  useEffect(() => {
    const savedSearchKecamatan = sessionStorage.getItem('searchKecamatan');
    const savedSearchOPD = sessionStorage.getItem('searchOPD');

    if (savedSearchKecamatan) {
      setSearch(savedSearchKecamatan);
      sessionStorage.removeItem('searchKecamatan');
      setPage(1);
      getReports(selectedStatus, 1, limit, savedSearchKecamatan);
      return;
    }

    if (savedSearchOPD) {
      setSearch(savedSearchOPD);
      sessionStorage.removeItem('searchOPD');
      setPage(1);
      getReports(selectedStatus, 1, limit, savedSearchOPD);
      return;
    }

    const delayDebounce = setTimeout(() => {
      setPage(1);
      getReports(selectedStatus, 1, limit, search);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  useEffect(() => {
    getReports(selectedStatus, page, limit, search);
  }, [page, limit]);

  useEffect(() => {
    setPage(1);
    getReports(selectedStatus, 1, limit, search);
  }, [sorts]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-[300] bg-white">
        <HeaderSection
          search={search}
          setSearch={setSearch}
          statusCounts={statusCounts}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          isMobile={isMobile}
          limit={limit}
          setLimit={setLimit}
          setPage={setPage}
        />
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <TableSection
              filteredData={filteredData}
              toggleSort={toggleSort}
              sorts={sorts}
              role={role}
              selectedIds={selectedIds}
              toggleSingleSelect={toggleSingleSelect}
              toggleSelectAll={toggleSelectAll}
              allSelected={allSelected}
              handleDeleteSelected={handleDeleteSelected}
              toggleMode={toggleMode}
              setSelectedLoc={setSelectedLoc}
              setPhotoModal={setPhotoModal}
            />
          </div>
          {/* Sticky Pagination inside scroll area */}
          <div className="sticky bottom-0 z-10 bg-white border-t px-2 py-2">
            <Pagination page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedLoc && <MapModal selectedLoc={selectedLoc} onClose={() => setSelectedLoc(null)} />}
      {photoModal && <PhotoModal photoModal={photoModal} onClose={() => setPhotoModal(null)} />}
    </div>
  );
}
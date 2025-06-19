"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosInstance";
import dynamic from "next/dynamic";
import { Chat, SortKey } from "../../lib/types";
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
  "Ditutup",
];

export default function Laporan() {
  // ----------------------- STATE HOOKS -----------------------
  const [data, setData] = useState<Chat[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(100);
  const [page, setPage] = useState(1);
  const [sorts, setSorts] = useState<{ key: SortKey; order: "asc" | "desc" }[]>([
    { key: "prioritas", order: "desc" },
    { key: "date", order: "desc" },
  ]);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [selectedLoc, setSelectedLoc] = useState<{ lat: number; lon: number; desa: string } | null>(null);
  const [photoModal, setPhotoModal] = useState<string[] | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false); // <--- PAKAI useState

  // Helpers
  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "guest" : "guest";
  const LS_KEY = (field: string) => `pengaduan_${field}_${username}`;

  // ----------------------- API FUNCTIONS -----------------------
  const getReports = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        status: selectedStatus !== "Semua" ? selectedStatus : undefined,
        search: search?.trim() || undefined,
        sorts: JSON.stringify(sorts),
      };
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports`, { params });
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
    } finally {
      setLoading(false);
    }
  };

  const getSummary = async () => {
    try {
      const params: any = {};
      if (selectedStatus && selectedStatus !== "Semua") params.status = selectedStatus;
      if (search && search.trim()) params.search = search.trim();

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports/summary-laporan`,
        { params }
      );
      setStatusCounts(res.data || {});
    } catch (err) {
      console.error("❌ Failed to fetch summary:", err);
      setStatusCounts({});
    }
  };

  // ----------------------- EFFECTS: HYDRATE FILTER (ATOMIC) -----------------------
  useEffect(() => {
    if (hydrated) return;

    setRole(localStorage.getItem("role") || null);

    const clickedSearch = sessionStorage.getItem("searchClicked");
    const clickedStatus = sessionStorage.getItem("statusClicked");

    // PATCH: HANDLE SESSION CLICK
    if (clickedSearch || clickedStatus) {
      // Hapus semua key filter pengaduan_* dari localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("pengaduan_")) {
          localStorage.removeItem(key);
        }
      });

      // Isi localStorage dari session (biar persist)
      if (clickedStatus) localStorage.setItem(LS_KEY("status"), clickedStatus);
      if (clickedSearch) localStorage.setItem(LS_KEY("search"), clickedSearch);
    }

    // Ambil dari localStorage seperti biasa
    const savedStatus = localStorage.getItem(LS_KEY("status"));
    const savedPage = localStorage.getItem(LS_KEY("page"));
    const savedLimit = localStorage.getItem(LS_KEY("limit"));
    const savedSorts = localStorage.getItem(LS_KEY("sorts"));
    const savedSearch = localStorage.getItem(LS_KEY("search"));

    setSelectedStatus(savedStatus || "Semua");
    setPage(Number(savedPage) || 1);
    setLimit(Number(savedLimit) || 100);
    setSorts(savedSorts ? JSON.parse(savedSorts) : [
      { key: "prioritas", order: "desc" },
      { key: "date", order: "desc" },
    ]);
    setSearch(savedSearch || "");

    sessionStorage.clear();
    setHydrated(true);
  }, [hydrated]);

  // ----------------------- EFFECTS: FETCH DATA (AFTER HYDRATED) -----------------------
  useEffect(() => {
    if (!hydrated) return;
    getSummary();
    getReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, selectedStatus, search, page, limit, sorts]);

  // ----------------------- EFFECTS: SYNC STORAGE (AFTER HYDRATED) -----------------------
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY("status"), selectedStatus);
    localStorage.setItem(LS_KEY("page"), page.toString());
    localStorage.setItem(LS_KEY("limit"), limit.toString());
    localStorage.setItem(LS_KEY("sorts"), JSON.stringify(sorts));
    localStorage.setItem(LS_KEY("search"), search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, selectedStatus, search, page, limit, sorts]);

  // Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1200);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ----------------------- SORTING, TOGGLE, HANDLERS -----------------------
  const toggleSort = (key: SortKey) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (!existing) return [...prev, { key, order: "asc" }];
      if (existing.order === "asc") return prev.map((s) => s.key === key ? { key, order: "desc" } : s);
      return prev.filter((s) => s.key !== key);
    });
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
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filteredData.map((chat) => chat.sessionId));
  };

  // Hapus data terpilih
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

  // Update prioritas laporan
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

  // ----------------------- RENDER -----------------------
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-[500] bg-white">
        <HeaderSection
          search={search}
          setSearch={setSearch}
          statusCounts={statusCounts}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          isMobile={isMobile}
          limit={limit}
          setLimit={setLimit}
          page={page}
          setPage={setPage}
        />
      </div>

      {/* Table */}
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
              loading={loading}
              setSorts={setSorts}
            />
          </div>
          {/* Pagination */}
          <div className="sticky bottom-0 z-10 bg-white border-t px-2 py-2">
            <Pagination page={page} setPage={setPage} totalPages={totalPages} />
          </div>
        </div>
      </div>
      {/* Modal */}
      {selectedLoc && <MapModal selectedLoc={selectedLoc} onClose={() => setSelectedLoc(null)} />}
      {photoModal && <PhotoModal photoModal={photoModal} onClose={() => setPhotoModal(null)} />}
    </div>
  );
}
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
  const [selectedStatus, setSelectedStatus] = useState("Semua Status");
  const [selectedSituasi, setSelectedSituasi] = useState("Semua Situasi");
  const [selectedOpd, setSelectedOpd] = useState("Semua OPD");
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
  const [photoModalInfo, setPhotoModalInfo] = useState<{ sessionId: string; userName: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  const [opdList, setOpdList] = useState<{ opd: string; count: number }[]>([]);  
  const [opdTotal, setOpdTotal] = useState<number>(0);  
  const [situasiList, setSituasiList] = useState<{ situasi: string; count: number }[]>([]);  
  const [situasiTotal, setSituasiTotal] = useState<number>(0);  

  // State untuk total reports
  const [totalReports, setTotalReports] = useState<number>(0);

  // State untuk force mode bot
  const [forceModeStates, setForceModeStates] = useState<Record<string, boolean>>({});
  const [loadingForceMode, setLoadingForceMode] = useState<Record<string, boolean>>({});
  const [isPinnedOnly, setIsPinnedOnly] = useState(false);
  const [isByMeOnly, setIsByMeOnly] = useState(false);

  // Helpers
  const username = typeof window !== "undefined" ? localStorage.getItem("username") || "guest" : "guest";
  const namaAdmin = typeof window !== "undefined" ? localStorage.getItem("nama_admin") || "" : "";
  const LS_KEY = (field: string) => `pengaduan_${field}_${username}`;

  // ----------------------- API FUNCTIONS -----------------------
  const getReports = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        status: selectedStatus !== "Semua Status" ? selectedStatus : undefined,
        search: search?.trim() || undefined,
        sorts: JSON.stringify(sorts),
        situasi: selectedSituasi !== "Semua Situasi" ? selectedSituasi : undefined,
        opd: selectedOpd !== "Semua OPD" ? selectedOpd : undefined,
        is_pinned: isPinnedOnly ? true : undefined,
        // Backend belum support byMeOnly parameter, jadi dicomment dulu
        // byMeOnly: isByMeOnly ? true : undefined,
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn("Reports API call timeout after 25 seconds");
        controller.abort();
      }, 25000);
      
      // Use /reports/new endpoint for all data
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/reports/new`, { 
        params,
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      // Set data for table (flatten user, address, but keep processed_by as object)
      setData((res.data.data || []).map((item: any) => ({
        ...item,
        user: typeof item.user === "object" && item.user !== null ? item.user.name : item.user,
        address: typeof item.user === "object" && item.user !== null ? item.user.address : item.address,
        // Keep processed_by as object to maintain nama_admin and role properties
        processed_by: typeof item.processed_by === "object" && item.processed_by !== null ? item.processed_by : null,
        // tindakan is kept as object for status, situasi, etc.
      })));
      setTotalPages(res.data.totalPages || 1);
      setTotalReports(res.data.totalReports || 0);
      // Set dropdown counts/lists from summary
      setStatusCounts(res.data.summary?.status || {});
      setOpdList(Object.entries(res.data.summary?.opd || {}).map(([opd, count]) => ({ opd, count: Number(count) })));
      setOpdTotal(res.data.totalReports || 0);
      setSituasiList(Object.entries(res.data.summary?.situasi || {}).map(([situasi, count]) => ({ situasi, count: Number(count) })));
      setSituasiTotal(res.data.totalReports || 0);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.error("❌ Reports fetch aborted due to timeout");
      } else {
        console.error("❌ Fetch error:", err);
      }
      setData([]);
      setStatusCounts({});
      setOpdList([]);
      setOpdTotal(0);
      setSituasiList([]);
      setSituasiTotal(0);
      setTotalReports(0);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------- EFFECTS: HYDRATE FILTER (ATOMIC) -----------------------
  useEffect(() => {
    if (hydrated) return;

    setRole(localStorage.getItem("role") || null);

    const clickedSearch = sessionStorage.getItem("searchClicked");
    const clickedStatus = sessionStorage.getItem("statusClicked");
    const clickedOpd = sessionStorage.getItem("opdClicked");

    // PATCH: HANDLE SESSION CLICK
    if (clickedSearch || clickedStatus || clickedOpd) {
      // Hapus semua key filter pengaduan_* dari localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("pengaduan_")) {
          localStorage.removeItem(key);
        }
      });

      // Isi localStorage dari session (biar persist)
      if (clickedStatus) localStorage.setItem(LS_KEY("status"), clickedStatus);
      if (clickedSearch) localStorage.setItem(LS_KEY("search"), clickedSearch);
      if (clickedOpd) localStorage.setItem(LS_KEY("opd"), clickedOpd);
    }

    // Ambil dari localStorage seperti biasa
    const savedStatus = localStorage.getItem(LS_KEY("status"));
    const savedPage = localStorage.getItem(LS_KEY("page"));
    const savedLimit = localStorage.getItem(LS_KEY("limit"));
    const savedSorts = localStorage.getItem(LS_KEY("sorts"));
    const savedSearch = localStorage.getItem(LS_KEY("search"));
    const savedShowHeader = localStorage.getItem(LS_KEY("showHeader"));
    const savedSituasi = localStorage.getItem(LS_KEY("situasi"));
    const savedOpd = localStorage.getItem(LS_KEY("opd"));
    const savedPinned = localStorage.getItem(LS_KEY("pinned"));
    const savedByMeOnly = localStorage.getItem(LS_KEY("byMeOnly"));

    setSelectedStatus(savedStatus || "Semua Status");
    setPage(Number(savedPage) || 1);
    setLimit(Number(savedLimit) || 100);
    setSorts(savedSorts ? JSON.parse(savedSorts) : [
      { key: "prioritas", order: "desc" },
      { key: "date", order: "desc" },
    ]);
    setSearch(savedSearch || "");
    setShowHeader(savedShowHeader === null ? true : savedShowHeader === "true");
    setSelectedSituasi(savedSituasi || "Semua Situasi");
    setSelectedOpd(savedOpd || "Semua OPD");
    setIsPinnedOnly(savedPinned === "true");
    
    // Set isByMeOnly dan handle auto search
    const isByMeOnlyValue = savedByMeOnly === "true";
    setIsByMeOnly(isByMeOnlyValue);
    
    // Jika isByMeOnly true dan ada nama_admin, override search dengan nama_admin
    if (isByMeOnlyValue && namaAdmin) {
      setSearch(namaAdmin);
    }

    sessionStorage.clear();
    setHydrated(true);
  }, [hydrated]);

  // ----------------------- EFFECTS: FETCH DATA (AFTER HYDRATED) -----------------------
  useEffect(() => {
    if (!hydrated) return;
    
    // Staggered API calls to prevent overload
    const fetchData = async () => {
      try {
        await getReports();
      } catch (error) {
        console.error('Error in staggered data fetch:', error);
      }
    };
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, selectedStatus, search, page, limit, sorts, selectedSituasi, selectedOpd, isPinnedOnly, isByMeOnly]);

  // Load force mode states setelah data diambil
  useEffect(() => {
    if (!hydrated || data.length === 0) return;
    loadForceModeStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, data]);

  useEffect(() => {
    if (!hydrated) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, showHeader]);

  // ----------------------- EFFECTS: SYNC STORAGE (AFTER HYDRATED) -----------------------
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY("status"), selectedStatus);
    localStorage.setItem(LS_KEY("page"), page.toString());
    localStorage.setItem(LS_KEY("limit"), limit.toString());
    localStorage.setItem(LS_KEY("sorts"), JSON.stringify(sorts));
    localStorage.setItem(LS_KEY("search"), search);
    localStorage.setItem(LS_KEY("situasi"), selectedSituasi);
    localStorage.setItem(LS_KEY("opd"), selectedOpd);
    localStorage.setItem(LS_KEY("pinned"), isPinnedOnly.toString());
    localStorage.setItem(LS_KEY("byMeOnly"), isByMeOnly.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, selectedStatus, search, page, limit, sorts, selectedSituasi, selectedOpd, isPinnedOnly, isByMeOnly]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LS_KEY("showHeader"), showHeader.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, showHeader]);

  // Responsive
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1080);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handler untuk toggle isByMeOnly dengan auto search
  const handleToggleByMeOnly = (newValue: boolean) => {
    if (newValue && namaAdmin) {
      // Hapus key search dari localStorage
      localStorage.removeItem(LS_KEY("search"));
      // Set search dengan nama admin
      setSearch(namaAdmin);
    } else {
      // Jika dimatikan, kosongkan search
      setSearch("");
    }
    setIsByMeOnly(newValue);
  };

  // Handler untuk status change
  const handleStatusChange = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setPage(1); // Reset ke halaman pertama saat status berubah
  };

  // Handler untuk situasi change
  const handleSituasiChange = (newSituasi: string) => {
    setSelectedSituasi(newSituasi);
    setPage(1); // Reset ke halaman pertama saat situasi berubah
  };

  // Handler untuk OPD change
  const handleOpdChange = (newOpd: string) => {
    setSelectedOpd(newOpd);
    setPage(1); // Reset ke halaman pertama saat OPD berubah
  };

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
          // Handle both array and string values for opd
          const opdA = a.tindakan?.opd || "";
          const opdB = b.tindakan?.opd || "";

          // Convert to string for sorting
          valA = Array.isArray(opdA) ? opdA.join(", ") : opdA;
          valB = Array.isArray(opdB) ? opdB.join(", ") : opdB;
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
      // await getDashboardSummary();
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

  // Wrapper function untuk setPhotoModal dengan info tambahan
  const handleSetPhotoModal = (photos: string[], reportInfo?: { sessionId: string; userName: string }) => {
    setPhotoModal(photos);
    setPhotoModalInfo(reportInfo || null);
  };

  // Toggle force mode untuk bot WhatsApp - GUNAKAN botModeService
  const toggleForceMode = async (from: string, currentForceMode: boolean) => {
    if (loadingForceMode[from]) return; // Hindari multiple calls

    try {
      setLoadingForceMode(prev => ({ ...prev, [from]: true }));

      const newForceMode = !currentForceMode;

      // Gunakan botModeService untuk konsistensi
      const { getBotModeService } = await import('../../services/botModeService');
      const service = getBotModeService();

      if (service) {
        await service.setForceMode(from, newForceMode);
      } else {
        // Fallback ke direct API call jika service tidak ada
        await axios.post(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/mode/force/${from}`, {
          force: newForceMode
        });
      }

      // Update state force mode
      setForceModeStates(prev => ({
        ...prev,
        [from]: newForceMode
      }));

      console.log(`Force mode ${newForceMode ? 'enabled' : 'disabled'} for ${from}`);
    } catch (err) {
      console.error("Gagal ubah force mode:", err);
      alert("Terjadi kesalahan saat mengubah mode bot.");
    } finally {
      setLoadingForceMode(prev => ({ ...prev, [from]: false }));
    }
  };

  // Load force mode status untuk semua user - GUNAKAN botModeService
  const loadForceModeStates = async () => {
    try {
      const uniqueUsers = [...new Set(data.map(chat => chat.from))];

      // Gunakan botModeService untuk konsistensi dan caching
      const { getBotModeService } = await import('../../services/botModeService');
      const service = getBotModeService();

      if (service) {
        // Gunakan service dengan caching
        const forceModePromises = uniqueUsers.map(async (from) => {
          try {
            const force = await service.getForceMode(from);
            return { from, force };
          } catch (error) {
            console.error(`Failed to get force mode for ${from}:`, error);
            return { from, force: false };
          }
        });

        const results = await Promise.all(forceModePromises);
        const newForceModeStates = results.reduce((acc, { from, force }) => {
          acc[from] = force;
          return acc;
        }, {} as Record<string, boolean>);

        setForceModeStates(newForceModeStates);
        console.log('Loaded force mode states:', newForceModeStates);
      } else {
        // Fallback ke direct API call
        const forceModePromises = uniqueUsers.map(async (from) => {
          try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/mode/${from}`);
            return {
              from,
              // Update field sesuai API response terbaru
              force: response.data?.forceModeManual || response.data?.forceMode || response.data?.force || false
            };
          } catch (error) {
            console.error(`Failed to get force mode for ${from}:`, error);
            return { from, force: false };
          }
        });

        const results = await Promise.all(forceModePromises);
        const newForceModeStates = results.reduce((acc, { from, force }) => {
          acc[from] = force;
          return acc;
        }, {} as Record<string, boolean>);

        setForceModeStates(newForceModeStates);
        console.log('Loaded force mode states (fallback):', newForceModeStates);
      }
    } catch (error) {
      console.error("Failed to load force mode states:", error);
    }
  };

  // Ismail Anugrah Saputra

  // ----------------------- RENDER -----------------------
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-[90] bg-white shadow-md">
        <div
          className={`relative transition-all duration-300 ${showHeader ? "opacity-100" : "opacity-0 max-h-0 overflow-hidden"}`}
        >
          <HeaderSection
            search={search}
            setSearch={setSearch}
            statusCounts={statusCounts}
            selectedStatus={selectedStatus}
            setSelectedStatus={handleStatusChange}
            isMobile={isMobile}
            limit={limit}
            setLimit={setLimit}
            page={page}
            setPage={setPage}
            selectedSituasi={selectedSituasi}
            setSelectedSituasi={handleSituasiChange}
            situasiList={situasiList}
            situasiTotal={situasiTotal}
            opdList={opdList}
            opdTotal={opdTotal}
            selectedOpd={selectedOpd}
            setSelectedOpd={handleOpdChange}
            isPinnedOnly={isPinnedOnly}
            setIsPinnedOnly={setIsPinnedOnly}
            isByMeOnly={isByMeOnly}
            setIsByMeOnly={handleToggleByMeOnly}
            totalReports={totalReports}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 h-full flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 h-full overflow-y-auto">
          {loading ? (
            <div>Loading...</div>
          ) : (
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
              toggleForceMode={toggleForceMode}
              forceModeStates={forceModeStates}
              loadingForceMode={loadingForceMode}
              setSelectedLoc={setSelectedLoc}
              setPhotoModal={handleSetPhotoModal}
              loading={loading}
              setSorts={setSorts}
              setSearch={setSearch}
            />
          )}
        </div>
        {/* Pagination */}
        <div className="sticky bottom-0 z-10 bg-white border-t px-2 py-2">
          <Pagination page={page} setPage={setPage} totalPages={totalPages} />
        </div>
      </div>
      {/* Modal */}
      {selectedLoc && <MapModal selectedLoc={selectedLoc} onClose={() => setSelectedLoc(null)} />}
      {photoModal && (
        <PhotoModal 
          photoModal={photoModal} 
          onClose={() => {
            setPhotoModal(null);
            setPhotoModalInfo(null);
          }} 
          reportInfo={photoModalInfo || undefined}
        />
      )}
    </div>
  );
}
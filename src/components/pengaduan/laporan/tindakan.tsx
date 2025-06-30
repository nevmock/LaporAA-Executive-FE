"use client";
import React, { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
// CSS import moved to global to avoid webpack issues
// import "react-medium-image-zoom/dist/styles.css";
import Keluhan from "./keluhan";
import { TindakanClientState } from "../../../lib/types";
import Profile from "./profile";
import { useTindakanState } from "./useTindakanState";
import { STATUS_LIST } from "./useTindakanState";
import Modal from "./Modal";
import LoadingModal from "./LoadingModal";
import AdminSection from "./AdminSection";

// Icons
import { FaEye, FaEyeSlash } from "react-icons/fa";

// Step Components
import Verifikasi from "./componentsTindakan/verifikasi";
import Verifikasi1 from "./componentsTindakan/verifikasi1";
import Verifikasi2 from "./componentsTindakan/verifikasi2";
import Proses from "./componentsTindakan/proses";
import Selesai from "./componentsTindakan/selesai";
import Selesai2 from "./componentsTindakan/selesai2";
import Ditutup from "./componentsTindakan/ditutup";

// AdminSelector component is now imported from a separate file

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const STEP_COMPONENTS = [Verifikasi, Verifikasi1, Verifikasi2, Proses, Selesai, Selesai2, Ditutup];

export interface TindakanActionProps {
    currentStepIndex: number;
    NEXT_STEP_LABELS: string[];
    isButtonDisabled: boolean;
    tooltipMessage: string;
    isLoading: boolean;
    isSaving: boolean;
    showRejectModal: boolean;
    showSelesaiModal: boolean;
    rejectReason: string;
    selesaiReason: string;
    setShowRejectModal: (v: boolean) => void;
    setShowSelesaiModal: (v: boolean) => void;
    setRejectReason: (v: string) => void;
    setSelesaiReason: (v: string) => void;
    handlePreviousStep: () => void;
    handleNextStep: () => void;
    saveData: (nextStatus?: string) => Promise<any>; // Changed return type to Promise<any> to accommodate AxiosResponse
    formData: any;
    API_URL: string;
    router: any;
    setIsSaving: (v: boolean) => void;
    confirmedVerifikasi2: boolean;
}

const TindakanComponent = function Tindakan({
    tindakan,
    sessionId,
    processed_by: rawProcessedBy,
    actionProps,
    reportData,
    role, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
    tindakan: TindakanClientState | null;
    sessionId: string;
    processed_by?: any; // Changed to any to handle different types safely
    actionProps?: (props: TindakanActionProps) => React.ReactNode;
    reportData?: any;
    role?: string | null;
}) {
    // Safely handle processed_by to ensure it's a string
    // Gunakan custom hook untuk state dan handler utama
    const state = useTindakanState(tindakan);
    const {
        formData, setFormData,
        currentStepIndex, setCurrentStepIndex,
        notif, setNotif,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        saveSuccessModalVisible,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        setSaveSuccessModalVisible,
        showModal, setShowModal,
        activePhotoIndex, setActivePhotoIndex,
        showConfirmModal, setShowConfirmModal,
        showLaporModal, setShowLaporModal,
        showBackModal, setShowBackModal,
        pendingNextStatus, setPendingNextStatus,
        isLoading, setIsLoading,
        isSaving, setIsSaving,
        showRejectModal, setShowRejectModal,
        showSelesaiModal, setShowSelesaiModal,
        rejectReason, setRejectReason,
        selesaiReason, setSelesaiReason,
        confirmedVerifikasi2, setConfirmedVerifikasi2,
        saveData, handleNextStep, handlePreviousStep, confirmPreviousStep,
        router
    } = state;

    // State untuk show/hide section
    const [showProfileState, setShowProfileState] = useState(currentStepIndex === 0);
    const [showKeluhanState, setShowKeluhanState] = useState(currentStepIndex === 0);
    const [openedSteps, setOpenedSteps] = useState<Set<number>>(new Set());
    
    // Ref untuk auto-scroll ke current active step
    const currentStepRef = useRef<HTMLDivElement>(null);
    
    // State untuk auto-scroll control
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [userHasScrolled, setUserHasScrolled] = useState(false);
    
    // Detect manual scroll untuk disable auto-scroll
    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;
        
        const handleScroll = () => {
            setUserHasScrolled(true);
            
            // Reset auto-scroll setelah user berhenti scroll selama 3 detik
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                setUserHasScrolled(false);
            }, 3000);
        };
        
        const scrollContainer = document.querySelector('.overflow-y-auto');
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
            
            return () => {
                scrollContainer.removeEventListener('scroll', handleScroll);
                clearTimeout(scrollTimeout);
            };
        }
    }, []);
    
    // Auto-scroll ke current active step ketika component mount atau step berubah
    useEffect(() => {
        const scrollToCurrentStep = () => {
            if (currentStepRef.current) {
                // Delay sedikit untuk memastikan rendering selesai
                setTimeout(() => {
                    currentStepRef.current?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start', // Scroll ke bagian atas dari current step
                        inline: 'nearest'
                    });
                }, 500); // Delay 500ms untuk memastikan semua komponen sudah render
            }
        };
        
        scrollToCurrentStep();
    }, [currentStepIndex]); // Trigger ketika step berubah

    // Set the processed_by data from Laporan.tsx into formData
    useEffect(() => {
        // Only update if rawProcessedBy exists and is different from formData.processed_by
        if (rawProcessedBy && (!formData.processed_by ||
            (typeof formData.processed_by === 'object' && formData.processed_by.nama_admin !== rawProcessedBy.nama_admin))) {
            console.log("Setting processed_by from Laporan.tsx to formData:", rawProcessedBy);
            setFormData((prev: any) => ({
                ...prev,
                processed_by: rawProcessedBy
            }));
        }
    }, [rawProcessedBy, formData.processed_by, setFormData]);

    // isButtonDisabled
    const isButtonDisabled =
        isLoading ||
        (currentStepIndex === 2 && !confirmedVerifikasi2 && !formData.trackingId) ||
        (currentStepIndex === 3 && !formData.opd) ||
        (currentStepIndex === 2 && formData.status_laporan !== "Sedang Diproses OPD Terkait") ||
        (currentStepIndex === 3 && formData.status_laporan !== "Telah Diproses OPD Terkait");

    // Tambahkan deklarasi NEXT_STEP_LABELS dan tooltipMessage di atas return utama
    const NEXT_STEP_LABELS = [
        "Lanjut Verifikasi",
        "Konfirmasi Tindak Lanjut",
        "Tindak Lanjut OPD Terkait",
        "Selesai Penanganan",
        "Selesai Pengaduan",
        "Selesai",
    ];

    const tooltipMessage = isLoading
        ? "Sedang memproses..."
        : currentStepIndex === 2 && !confirmedVerifikasi2 && !formData.trackingId
            ? "Konfirmasi Isi Data Ke SP4N Lapor Terlebih Dahulu"
            : currentStepIndex === 3 && !formData.opd
                ? "Pastikan Data Tindak Lanjut Sudah Tersedia di SP4N Lapor"
                : currentStepIndex === 2 && formData.status_laporan !== "Sedang Diproses OPD Terkait"
                    ? "Pastikan Status laporan SP4N Lapor sudah 'Sedang Diproses OPD Terkait'"
                    : currentStepIndex === 3 && formData.status_laporan !== "Telah Diproses OPD Terkait"
                        ? "Pastikan Status laporan SP4N Lapor sudah 'Selesai'"
                        : "";

    // Create a stable subset of formData that contains only what's needed by actionProps
    const formDataForAction = useMemo(() => ({
        opd: formData.opd,
        trackingId: formData.trackingId,
        status_laporan: formData.status_laporan,
        report: formData.report,
        situasi: formData.situasi,
        // Add any other formData fields needed by ActionButtons component
    }), [
        formData.opd,
        formData.trackingId,
        formData.status_laporan,
        formData.report,
        formData.situasi,
    ]);

    // Use memoization to create stable props for actionProps with reduced dependency list
    const actionPropsParams = useMemo(() => ({
        currentStepIndex,
        NEXT_STEP_LABELS,
        isButtonDisabled,
        tooltipMessage,
        isLoading,
        isSaving,
        showRejectModal,
        showSelesaiModal,
        rejectReason,
        selesaiReason,
        setShowRejectModal,
        setShowSelesaiModal,
        setRejectReason,
        setSelesaiReason,
        handlePreviousStep,
        handleNextStep,
        saveData,
        formData: formDataForAction,
        API_URL: API_URL || '',
        router,
        setIsSaving,
        confirmedVerifikasi2,
    }), [
        // Only include dependencies that should trigger re-rendering of action buttons
        currentStepIndex,
        isButtonDisabled,
        isLoading,
        isSaving,
        formDataForAction.status_laporan,
        formDataForAction.opd,
        formDataForAction.trackingId,
        confirmedVerifikasi2
        // Deliberately excluding other dependencies to prevent render loops
    ]);

    // Memoize reportData untuk referensi stabil - hanya pakai fields yang dibutuhkan
    const memoizedReportData = useMemo(() => {
        if (!reportData) return null;

        // Return just the necessary fields to avoid deep comparisons on the entire reportData
        return {
            _id: reportData._id,
            sessionId: reportData.sessionId,
            message: reportData.message,
            from: reportData.from,
            user: reportData.user,
            location: reportData.location,
            photos: reportData.photos,
            createdAt: reportData.createdAt
        };
    }, [
        reportData?._id,
        reportData?.sessionId,
        reportData?.message,
        reportData?.from,
        reportData?.user?.name,
        reportData?.location?.latitude,
        reportData?.location?.longitude,
        reportData?.photos?.length,
        reportData?.createdAt
    ]);

    // Call actionProps once when the component mounts or when critical dependencies change
    useEffect(() => {
        // Safety check for actionProps
        if (typeof actionProps !== 'function') {
            console.log("No actionProps function provided or not a function");
            return;
        }

        try {
            console.debug("Setting up actionProps effect with currentStepIndex:", currentStepIndex);

            // Use a delay to allow rendering to complete before triggering prop callback
            const timeoutId = setTimeout(() => {
                try {
                    actionProps(actionPropsParams as TindakanActionProps);
                } catch {
                    // Continue normal operation despite error - don't block UI
                }
            }, 200); // Delay to ensure stable render cycle

            return () => {
                clearTimeout(timeoutId);
            };
        } catch {
            // Fall back gracefully without blocking the UI
        }
    }, [
        actionProps,
        currentStepIndex,
        isButtonDisabled,
        isLoading,
        isSaving,
        actionPropsParams?.formData?.opd,
        actionPropsParams?.formData?.trackingId,
        actionPropsParams?.formData?.status_laporan
    ]);

    // Guard: only render if sessionId and (tindakan or reportData) exist
    if (!sessionId || (!tindakan && !reportData)) {
        return <div className="flex items-center justify-center h-full text-gray-500">Data tidak tersedia.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 text-sm text-gray-800">
            {/* Loading Overlay saat navigating - similar to ActionButtons */}
            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[10000]">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
                        <svg className="animate-spin w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        <span className="text-gray-700 font-medium">
                            {showBackModal ? "Menyimpan dan kembali ke tahap sebelumnya..." : "Memproses tahap selanjutnya..."}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Notif & Modal */}
            {notif && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border border-green-200 px-3 sm:px-6 py-3 rounded-lg mb-4 sm:mb-6 mx-2 sm:mx-0 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs sm:text-sm">{notif}</span>
                    </div>
                </div>
            )}
            {/* KONTEN UTAMA (scrollable) */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 pb-4 sm:pb-6 h-full">
                <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
                    {/* Detail Admin */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <AdminSection
                            formData={formData}
                            setFormData={setFormData}
                            setNotif={setNotif}
                            setIsSaving={setIsSaving}
                            router={router}
                            API_URL={API_URL || ''}
                        />
                    </div>
                    
                    {/* Detail Pelapor */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="truncate">Detail Pelapor</span>
                                </h2>
                                <button
                                    onClick={() => setShowProfileState((prev) => !prev)}
                                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium bg-white border border-blue-200 text-blue-700 rounded-md sm:rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex-shrink-0"
                                >
                                    {showProfileState ? (
                                        <>
                                            <FaEyeSlash size={10} className="sm:w-3 sm:h-3" />
                                            <span className="hidden sm:inline">Sembunyikan</span>
                                            <span className="sm:hidden">Hide</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaEye size={10} className="sm:w-3 sm:h-3" />
                                            <span className="hidden sm:inline">Lihat Detail</span>
                                            <span className="sm:hidden">Show</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        {showProfileState && (
                            <div className="p-3 sm:p-6">
                                <Profile sessionId={sessionId} data={reportData} />
                            </div>
                        )}
                    </div>
                    
                    {/* Detail Keluhan */}
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="truncate">Detail Keluhan - ({sessionId})</span>
                                </h2>
                                <button
                                    onClick={() => setShowKeluhanState((prev) => !prev)}
                                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium bg-white border border-amber-200 text-amber-700 rounded-md sm:rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-all duration-200 flex-shrink-0"
                                >
                                    {showKeluhanState ? (
                                        <>
                                            <FaEyeSlash size={10} className="sm:w-3 sm:h-3" />
                                            <span className="hidden sm:inline">Sembunyikan</span>
                                            <span className="sm:hidden">Hide</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaEye size={10} className="sm:w-3 sm:h-3" />
                                            <span className="hidden sm:inline">Lihat Detail</span>
                                            <span className="sm:hidden">Show</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        {showKeluhanState && memoizedReportData && (
                            <div className="p-3 sm:p-6">
                                <Keluhan
                                    key={`keluhan-${sessionId}`}
                                    sessionId={sessionId}
                                    data={memoizedReportData}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Previous Steps (show with toggle) */}
                <div className="max-w-6xl mx-auto mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                    {Array.from({ length: currentStepIndex }).map((_, idx) => (
                        <div key={`prev-step-${idx}`} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2 sm:gap-3">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full"></div>
                                        </div>
                                        <span className="truncate text-sm sm:text-base">{STATUS_LIST[idx]}</span>
                                        <span className="px-2 py-0.5 sm:py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full flex-shrink-0">
                                            Selesai
                                        </span>
                                    </h2>
                                    <button
                                        onClick={() => {
                                            const newOpenedSteps = new Set(openedSteps);
                                            if (newOpenedSteps.has(idx)) {
                                                newOpenedSteps.delete(idx);
                                            } else {
                                                newOpenedSteps.add(idx);
                                            }
                                            setOpenedSteps(newOpenedSteps);
                                        }}
                                        className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium bg-white border border-gray-200 text-gray-700 rounded-md sm:rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex-shrink-0"
                                    >
                                        {openedSteps.has(idx) ? (
                                            <>
                                                <FaEyeSlash size={10} className="sm:w-3 sm:h-3" />
                                                <span className="hidden sm:inline">Sembunyikan</span>
                                                <span className="sm:hidden">Hide</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaEye size={10} className="sm:w-3 sm:h-3" />
                                                <span className="hidden sm:inline">Lihat Detail</span>
                                                <span className="sm:hidden">Show</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            {openedSteps.has(idx) && (
                                <div className="p-3 sm:p-6 bg-gray-50/30">
                                    {(() => {
                                        if (idx === 2) { // Verifikasi2
                                            return (
                                                <Verifikasi2
                                                    data={formData}
                                                    onChange={setFormData}
                                                    onConfirmChange={val => setConfirmedVerifikasi2(val)}
                                                    saveData={saveData}
                                                />
                                            );
                                        } else if (idx === 0) { // Verifikasi
                                            return <Verifikasi data={{ ...formData, sessionId }} onChange={setFormData} />;
                                        } else if (idx === 1) { // Verifikasi1
                                            return <Verifikasi1 data={{ ...formData }} onChange={setFormData} saveData={saveData} />;
                                        } else if (idx === 3) { // Proses
                                            return <Proses data={formData} onChange={setFormData} saveData={saveData} />;
                                        } else if (idx === 4) { // Selesai
                                            return <Selesai data={{ ...formData, sessionId }} reportData={reportData} saveData={saveData} />;
                                        } else if (idx === 5) { // Selesai2
                                            return <Selesai2 data={{ ...formData, sessionId }} reportData={reportData} saveData={saveData} />;
                                        } else if (idx === 6) { // Ditutup
                                            return <Ditutup data={{ ...formData, sessionId }} saveData={saveData} />;
                                        }
                                        return null;
                                    })()}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Current Active Step (always shown) */}
                <div ref={currentStepRef} className="max-w-6xl mx-auto mt-4 sm:mt-6">
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-blue-200 overflow-hidden">
                        <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full animate-pulse"></div>
                                    </div>
                                    <span className="truncate text-base sm:text-xl">{STATUS_LIST[currentStepIndex]}</span>
                                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-medium bg-white/20 text-white rounded-full backdrop-blur-sm flex-shrink-0">
                                        Aktif
                                    </span>
                                </h2>
                            </div>
                        </div>
                        <div className="p-3 sm:p-6 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
                            {(() => {
                                const status = STATUS_LIST[currentStepIndex];
                                if (status === "Verifikasi Situasi") {
                                    return (
                                        <Verifikasi1
                                            data={{ ...formData }}
                                            onChange={setFormData}
                                            saveData={saveData}
                                        />
                                    );
                                }
                                else if (status === "Verifikasi Kelengkapan Berkas") {
                                    return (
                                        <Verifikasi2
                                            data={{ ...formData }}
                                            onChange={setFormData}
                                            onConfirmChange={val => setConfirmedVerifikasi2(val)}
                                            saveData={saveData}
                                        />
                                    );
                                } else if (status === "Proses OPD Terkait") {
                                    return (
                                        <Proses
                                            data={{ ...formData }}
                                            onChange={setFormData}
                                            saveData={saveData}
                                        />
                                    );
                                } else if (status === "Selesai Pengaduan") {
                                    return (
                                        <Selesai2
                                            data={{ ...formData, sessionId }}
                                            reportData={reportData}
                                            saveData={saveData}
                                        />
                                    );
                                } else if (status === "Selesai Penanganan") {
                                    return (
                                        <Selesai
                                            data={{ ...formData, sessionId }}
                                            reportData={reportData}
                                            saveData={saveData}
                                        />
                                    );
                                } else if (status === "Ditutup") {
                                    return (
                                        <Ditutup
                                            data={{ ...formData, sessionId }}
                                            saveData={saveData}
                                        />
                                    );
                                } else {
                                    const StepComponent = STEP_COMPONENTS[currentStepIndex];
                                    return (
                                        <StepComponent
                                            data={{ ...formData, sessionId }}
                                            onChange={setFormData}
                                            saveData={saveData}
                                        />
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal Zoom Foto */}
            <Modal open={showModal && !!formData.photos} onClose={() => setShowModal(false)} maxWidth="max-w-4xl">
                {formData.photos && formData.photos.length > 0 && (
                    <div className="relative bg-white rounded-lg sm:rounded-xl overflow-hidden">
                        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="w-8 h-8 sm:w-10 sm:h-10 bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="bg-gray-50">
                            <Zoom>
                                <Image
                                    src={`${API_URL}${formData.photos[activePhotoIndex]}`}
                                    className="w-full h-64 sm:h-96 object-contain cursor-zoom-in"
                                    alt={`Foto ${activePhotoIndex + 1}`}
                                    width={800}
                                    height={384}
                                />
                            </Zoom>
                        </div>
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-white border-t border-gray-200">
                            <button 
                                onClick={() => setActivePhotoIndex((prev) => prev > 0 ? prev - 1 : (formData.photos.length - 1))} 
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md sm:rounded-lg transition-colors"
                            >
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                <span className="hidden sm:inline">Sebelumnya</span>
                                <span className="sm:hidden">Prev</span>
                            </button>
                            <span className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 rounded-md sm:rounded-lg">
                                Foto {activePhotoIndex + 1} dari {formData.photos.length}
                            </span>
                            <button 
                                onClick={() => setActivePhotoIndex((prev) => prev < (formData.photos.length - 1) ? prev + 1 : 0)} 
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md sm:rounded-lg transition-colors"
                            >
                                <span className="hidden sm:inline">Selanjutnya</span>
                                <span className="sm:hidden">Next</span>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            <LoadingModal open={isSaving} />
            {/* Modal Konfirmasi Proses OPD Terkait */}
            <Modal open={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
                <div className="p-4 sm:p-6">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Konfirmasi Lanjutkan Proses</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Lanjutkan proses ke tahap Selesai Penanganan? Data ini tidak dapat dikembalikan dan akan langsung di teruskan ke Warga.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowConfirmModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                        >
                            Batal
                        </button>
                        <button
                            onClick={async () => {
                                if (pendingNextStatus) {
                                    try {
                                        setIsLoading(true);
                                        await saveData(pendingNextStatus);
                                        setCurrentStepIndex((prev: number) => prev + 1);
                                        setPendingNextStatus(null);
                                        setShowConfirmModal(false);
                                    } catch (error: any) {
                                        console.error("Error saving data:", error);
                                        alert(`Gagal menyimpan data: ${error?.message || "Terjadi kesalahan"}`);
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }
                            }}
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors order-1 sm:order-2 ${
                                isLoading 
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                            }`}
                        >
                            {isLoading ? "Memproses..." : "Lanjutkan"}
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Modal Konfirmasi SP4N Lapor */}
            <Modal open={showLaporModal} onClose={() => setShowLaporModal(false)}>
                <div className="p-4 sm:p-6">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Konfirmasi Tindak Lanjut</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Yakin data sudah di croscheck{formData.situasi === 'Darurat' ? '' : `, lanjutkan ke SP4N Lapor`}?
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowLaporModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                        >
                            Batal
                        </button>
                        <button
                            onClick={async () => {
                                if (pendingNextStatus) {
                                    try {
                                        setIsSaving(true);
                                        await saveData(pendingNextStatus);
                                        setCurrentStepIndex((prev: number) => formData.situasi === 'Darurat' ? 5 : prev + 1);
                                        setPendingNextStatus(null);
                                        setShowLaporModal(false);
                                        if (currentStepIndex === 1 && formData.situasi !== 'Darurat') {
                                            window.open("https://www.lapor.go.id/", "_blank", "noopener,noreferrer");
                                        }
                                    } catch (error: any) {
                                        console.error("Error saving data:", error);
                                        alert(`Gagal menyimpan data: ${error?.message || "Terjadi kesalahan"}`);
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }
                            }}
                            disabled={isSaving}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors order-1 sm:order-2 ${
                                isSaving 
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {isSaving ? "Memproses..." : "Lanjutkan"}
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Modal Konfirmasi Kembali */}
            <Modal open={showBackModal} onClose={() => setShowBackModal(false)}>
                <div className="p-4 sm:p-6">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Konfirmasi Mundur</h3>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                Yakin ingin mundur ke tahapan status sebelumnya? Data pada tahapan status saat ini akan disimpan terlebih dahulu.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={() => setShowBackModal(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                        >
                            Batal
                        </button>
                        <button
                            onClick={confirmPreviousStep}
                            disabled={isLoading}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors order-1 sm:order-2 flex items-center gap-2 ${
                                isLoading 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-orange-600 hover:bg-orange-700"
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                "Ya, Kembali"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Floating Scroll to Current Step Button */}
            <div className="fixed bottom-4 right-4 z-50">
                <button
                    onClick={() => {
                        if (currentStepRef.current) {
                            currentStepRef.current.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                                inline: 'nearest'
                            });
                        }
                    }}
                    className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                    title="Scroll ke tahap aktif"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default React.memo(TindakanComponent);

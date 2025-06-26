import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { IoMdCloseCircle } from "react-icons/io";
import { GrLinkNext } from "react-icons/gr";
import { FaCheckDouble } from "react-icons/fa";
import { RiArrowGoBackLine } from "react-icons/ri";
import axios from "../../../utils/axiosInstance";

interface ActionButtonsProps {
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
    saveData: () => Promise<void>;
    formData: any;
    API_URL: string;
    router: any;
    setIsSaving: (v: boolean) => void;
    confirmedVerifikasi2: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    currentStepIndex,
    NEXT_STEP_LABELS,
    isButtonDisabled,
    tooltipMessage,
    isLoading,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    saveData,
    formData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    API_URL,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    router,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setIsSaving,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    confirmedVerifikasi2,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    
    // Local fallback states jika parent tidak mengelola state dengan benar
    const [localShowRejectModal, setLocalShowRejectModal] = useState(false);
    const [localShowSelesaiModal, setLocalShowSelesaiModal] = useState(false);
    const [localRejectReason, setLocalRejectReason] = useState("");
    const [localSelesaiReason, setLocalSelesaiReason] = useState("");
    const [modalContainer, setModalContainer] = useState<HTMLElement | null>(null);
    
    // Create modal container on mount
    useEffect(() => {
        const container = document.createElement('div');
        container.id = 'action-buttons-modal-container';
        document.body.appendChild(container);
        setModalContainer(container);
        
        return () => {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
        };
    }, []);
    
    // Use local state as fallback if parent states are not working
    const effectiveShowRejectModal = showRejectModal || localShowRejectModal;
    const effectiveShowSelesaiModal = showSelesaiModal || localShowSelesaiModal;
    const effectiveRejectReason = rejectReason || localRejectReason;
    const effectiveSelesaiReason = selesaiReason || localSelesaiReason;
    
    // Enhanced setters that try both parent and local state
    const safeSetShowRejectModal = (value: boolean) => {
        setShowRejectModal(value);
        setLocalShowRejectModal(value);
    };
    
    const safeSetShowSelesaiModal = (value: boolean) => {
        setShowSelesaiModal(value);
        setLocalShowSelesaiModal(value);
    };
    
    const safeSetRejectReason = (value: string) => {
        setRejectReason(value);
        setLocalRejectReason(value);
    };
    
    const safeSetSelesaiReason = (value: string) => {
        setSelesaiReason(value);
        setLocalSelesaiReason(value);
    };
    
    // Helper untuk tombol modal
    const handleReject = async () => {
        if (!effectiveRejectReason.trim()) {
            alert("Alasan penutupan harus diisi.");
            return;
        }
        
        setIsRejecting(true);
        try {
            const updated = {
                ...formData,
                status: "Ditutup",
                updatedAt: new Date().toISOString(),
                keterangan: effectiveRejectReason.trim(),
            };
            
            const response = await axios.put(`/tindakan/${formData.report}`, updated);
            
            if (response.status === 200) {
                safeSetShowRejectModal(false);
                safeSetRejectReason("");
                // Tambahkan delay untuk user experience yang lebih baik
                setTimeout(() => {
                    // Force refresh untuk update header dan progress bar secara realtime
                    window.location.reload();
                }, 500);
            } else {
                throw new Error(`Failed to update status: ${response.status}`);
            }
        } catch {
            alert("Gagal menolak pengaduan. Silakan coba lagi.");
        } finally {
            setIsRejecting(false);
        }
    };

    const handleSelesai = async () => {
        if (!effectiveSelesaiReason.trim()) {
            alert("Alasan penyelesaian harus diisi.");
            return;
        }
        
        setIsCompleting(true);
        try {
            const updated = {
                ...formData,
                status: "Selesai Penanganan",
                updatedAt: new Date().toISOString(),
                keterangan: effectiveSelesaiReason.trim(),
            };
            
            const response = await axios.put(`/tindakan/${formData.report}`, updated);
            
            if (response.status === 200) {
                safeSetShowSelesaiModal(false);
                safeSetSelesaiReason("");
                // Tambahkan delay untuk user experience yang lebih baik
                setTimeout(() => {
                    // Force refresh untuk update header dan progress bar secara realtime
                    window.location.reload();
                }, 500);
            } else {
                throw new Error(`Failed to update status: ${response.status}`);
            }
        } catch {
            alert("Gagal menyelesaikan pengaduan. Silakan coba lagi.");
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <>
            {/* Loading Overlay saat navigating */}
            {isNavigating && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[10000]">
                    <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
                        <svg className="animate-spin w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        <span className="text-gray-700 font-medium">Memproses tahap selanjutnya...</span>
                    </div>
                </div>
            )}
            
            <div className="flex justify-center items-center gap-2">
            {/* Tombol Tutup (hanya di step pertama) */}
            {currentStepIndex === 0 && (
                <>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isRejecting) {
                                safeSetRejectReason("");
                                safeSetShowRejectModal(true);
                            }
                        }}
                        disabled={isRejecting}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <IoMdCloseCircle size={18} />
                        {isRejecting ? "Menutup..." : "Tutup Pengaduan"}
                    </button>

                    {/* Modal Tutup Pengaduan */}
                    {effectiveShowRejectModal && modalContainer && createPortal(
                        <div 
                            key="reject-modal"
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
                            style={{ 
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999
                            }}
                            onClick={(e) => {
                                // Close modal when clicking outside
                                if (e.target === e.currentTarget) {
                                    safeSetShowRejectModal(false);
                                }
                            }}
                        >
                            <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                                <h3 className="text-lg font-semibold text-red-700">Alasan Penutupan</h3>
                                <textarea
                                    value={effectiveRejectReason}
                                    onChange={(e) => safeSetRejectReason(e.target.value)}
                                    placeholder="Masukkan alasan penutupan pengaduan"
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none"
                                    rows={4}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => {
                                            safeSetRejectReason("");
                                            safeSetShowRejectModal(false);
                                        }}
                                        disabled={isRejecting}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleReject();
                                        }}
                                        disabled={isRejecting || !effectiveRejectReason.trim()}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isRejecting ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                </svg>
                                                Menutup...
                                            </>
                                        ) : (
                                            "Tutup"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>,
                        modalContainer
                    )}
                </>
            )}

            {/* Tombol Kembali (jika bukan step pertama) */}
            {currentStepIndex > 0 && currentStepIndex <= 3 && (
                <button
                    onClick={() => {
                        // Hanya trigger modal konfirmasi, tidak langsung reload
                        handlePreviousStep();
                    }}
                    disabled={isNavigating}
                    className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RiArrowGoBackLine size={18} />
                    Mundur
                </button>
            )}

            {/* Tombol Lanjutkan (hanya di step 0, 1, 2, 3) */}
            {currentStepIndex < NEXT_STEP_LABELS.length && currentStepIndex <= 3 && (
                <div className="relative inline-block"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}>
                    <button
                        onClick={async () => {
                            setIsNavigating(true);
                            try {
                                await handleNextStep();
                                // Langsung reload tanpa delay
                                window.location.reload();
                            } catch (error) {
                                setIsNavigating(false);
                                console.error("Error in next step:", error);
                            }
                        }}
                        disabled={isButtonDisabled || isNavigating}
                        className={`px-4 py-2 rounded-md text-white transition flex items-center gap-2 min-h-[40px] ${
                            isButtonDisabled || isNavigating
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-indigo-500 hover:bg-indigo-600"
                        }`}
                    >
                        {isLoading || isNavigating ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                {isNavigating ? "Memproses..." : "Menyimpan Data..."}
                            </span>
                        ) : (
                            <>
                                {NEXT_STEP_LABELS[currentStepIndex] || "Lanjutkan"}
                                <GrLinkNext size={16} />
                            </>
                        )}
                    </button>
                    {isButtonDisabled && tooltipMessage && isHovered && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-50">
                            {tooltipMessage}
                        </div>
                    )}
                </div>
            )}

            {/* Tombol Selesai (hanya di step pertama) */}
            {currentStepIndex === 0 && (
                <>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isCompleting) {
                                safeSetSelesaiReason("");
                                safeSetShowSelesaiModal(true);
                            }
                        }}
                        disabled={isCompleting}
                        className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaCheckDouble size={18} />
                        {isCompleting ? "Memproses..." : "Selesai Penanganan"}
                    </button>

                    {/* Modal Selesai Penanganan */}
                    {effectiveShowSelesaiModal && modalContainer && createPortal(
                        <div 
                            key="selesai-modal"
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
                            style={{ 
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999
                            }}
                            onClick={(e) => {
                                // Close modal when clicking outside
                                if (e.target === e.currentTarget) {
                                    safeSetShowSelesaiModal(false);
                                }
                            }}
                        >
                            <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                                <h3 className="text-lg font-semibold text-blue-400">Alasan Penyelesaian</h3>
                                <textarea
                                    value={effectiveSelesaiReason}
                                    onChange={(e) => safeSetSelesaiReason(e.target.value)}
                                    placeholder="Masukkan alasan penyelesaian pengaduan"
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none"
                                    rows={4}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => {
                                            safeSetSelesaiReason("");
                                            safeSetShowSelesaiModal(false);
                                        }}
                                        disabled={isCompleting}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleSelesai();
                                        }}
                                        disabled={isCompleting || !effectiveSelesaiReason.trim()}
                                        className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-md text-sm disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isCompleting ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                                </svg>
                                                Menyelesaikan...
                                            </>
                                        ) : (
                                            "Selesai"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>,
                        modalContainer
                    )}
                </>
            )}
            </div>
        </>
    );
};

export default ActionButtons;

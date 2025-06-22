import React, { useState } from "react";
import { IoMdCloseCircle } from "react-icons/io";
import { GrLinkNext, GrLinkPrevious } from "react-icons/gr";
import { FaCheckDouble } from "react-icons/fa";
import { RiSave3Fill } from "react-icons/ri";
import LoadingSpinner from "../../LoadingPage";

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
    formData,
    API_URL,
    router,
    setIsSaving,
    confirmedVerifikasi2,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    // Helper untuk tombol modal
    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert("Alasan penutupan harus diisi.");
            return;
        }
        try {
            const updated = {
                ...formData,
                status: "Ditutup",
                updatedAt: new Date().toISOString(),
                keterangan: rejectReason.trim(),
            };
            await fetch(`${API_URL}/tindakan/${formData.report}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            setShowRejectModal(false);
            router.push("/pengaduan");
        } catch (error) {
            alert("Gagal menolak pengaduan. Silakan coba lagi.");
        }
    };

    const handleSelesai = async () => {
        if (!selesaiReason.trim()) {
            alert("Alasan penyelesaian harus diisi.");
            return;
        }
        try {
            const updated = {
                ...formData,
                status: "Selesai Penanganan",
                updatedAt: new Date().toISOString(),
                keterangan: selesaiReason.trim(),
            };
            await fetch(`${API_URL}/tindakan/${formData.report}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });
            setShowSelesaiModal(false);
            router.push("/pengaduan");
        } catch (error) {
            alert("Gagal menyelesaikan pengaduan. Silakan coba lagi.");
        }
    };

    return (
        <div className="flex justify-center items-center gap-2">
            {/* Tombol Tutup (hanya di step pertama) */}
            {currentStepIndex === 0 && (
                <>
                    <button
                        onClick={() => {
                            setRejectReason("");
                            setShowRejectModal(true);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <IoMdCloseCircle size={18} />
                        Tutup Pengaduan
                    </button>

                    {/* Modal Tutup Pengaduan */}
                    {showRejectModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                            <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                                <h3 className="text-lg font-semibold text-red-700">Alasan Penutupan</h3>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Masukkan alasan penutupan pengaduan"
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none"
                                    rows={4}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => setShowRejectModal(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Tombol Kembali (jika bukan step pertama) */}
            {currentStepIndex > 0 && (
                <button
                    onClick={handlePreviousStep}
                    className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2 min-h-[40px]"
                >
                    <GrLinkPrevious size={18} />
                    Kembali
                </button>
            )}

            {/* Tombol Lanjutkan (dinamis status dan konfirmasi) */}
            {currentStepIndex < NEXT_STEP_LABELS.length && (
                <div className="relative inline-block"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}>
                    <button
                        onClick={handleNextStep}
                        disabled={isButtonDisabled}
                        className={`px-4 py-2 rounded-md text-white transition flex items-center gap-2 min-h-[40px] ${isButtonDisabled
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-indigo-500 hover:bg-indigo-600"
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Menyimpan Data...
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
                        onClick={() => {
                            setSelesaiReason("");
                            setShowSelesaiModal(true);
                        }}
                        className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                        <FaCheckDouble size={18} />
                        Selesai Penanganan
                    </button>

                    {/* Modal Selesai Penanganan */}
                    {showSelesaiModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                            <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                                <h3 className="text-lg font-semibold text-blue-400">Alasan Penyelesaian</h3>
                                <textarea
                                    value={selesaiReason}
                                    onChange={(e) => setSelesaiReason(e.target.value)}
                                    placeholder="Masukkan alasan penyelesaian pengaduan"
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none"
                                    rows={4}
                                />
                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        onClick={() => setShowSelesaiModal(false)}
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSelesai}
                                        className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-md text-sm"
                                    >
                                        Selesai
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ActionButtons;

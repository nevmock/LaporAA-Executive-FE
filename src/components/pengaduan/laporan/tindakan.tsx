"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../../utils/axiosInstance";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useSwipeable } from "react-swipeable";
import Keluhan from "./keluhan";
import { TindakanClientState } from "../../../lib/types";
import LoadingSpinner from "../../LoadingPage"

// Icons
import { IoMdCloseCircle } from "react-icons/io";
import { GrLinkNext, GrLinkPrevious } from "react-icons/gr";
import { FaCheckDouble } from "react-icons/fa";
import { RiSave3Fill } from "react-icons/ri";

// Step Components
import Verifikasi from "./componentsTindakan/verifikasi";
import Verifikasi1 from "./componentsTindakan/verifikasi1";
import Verifikasi2 from "./componentsTindakan/verifikasi2";
import Proses from "./componentsTindakan/proses";
import Selesai from "./componentsTindakan/selesai";
import Selesai2 from "./componentsTindakan/selesai2";
import Ditutup from "./componentsTindakan/ditutup";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const statusColors: Record<string, string> = {
    "Perlu Verifikasi": "#FF3131",
    "Verifikasi Situasi": "#5E17EB",
    "Verifikasi Kelengkapan Berkas": "#FF9F12",
    "Proses OPD Terkait": "rgb(250 204 21)",
    "Selesai Penanganan": "rgb(96 165 250)",
    "Selesai Pengaduan": "rgb(74 222 128)",
    "Ditutup": "black",
};

const STATUS_LIST = [
    "Perlu Verifikasi",
    "Verifikasi Situasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditutup",
];

const STEP_COMPONENTS = [Verifikasi, Verifikasi1, Verifikasi2, Proses, Selesai, Selesai2, Ditutup];

export default function Tindakan({
    tindakan,
    sessionId,
    processed_by,
}: {
    tindakan: TindakanClientState | null;
    sessionId: string;
    processed_by?: string;
}) {
    const [formData, setFormData] = useState<Partial<TindakanClientState>>({});
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [showKeluhan, setShowKeluhan] = useState(true);
    const [notif, setNotif] = useState<string | null>(null);
    const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
    const [showLaporModal, setShowLaporModal] = useState(false);
    const [pendingNextStatus, setPendingNextStatus] = useState<string | null>(null);
    const [confirmedVerifikasi2, setConfirmedVerifikasi2] = useState(false);
    const [confirmedProses, setConfirmedProses] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showSelesaiModal, setShowSelesaiModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selesaiReason, setSelesaiReason] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const router = useRouter();

    useEffect(() => {
        console.info(formData)
    }, [formData]);

    const showPrompt = (title: string, placeholder: string, callback: (input: string) => void) => {
        const input = window.prompt(title, placeholder);
        if (input && input.trim()) callback(input.trim());
    };

    useEffect(() => {
        if (tindakan) {
            setFormData(tindakan);
            const stepIndex = STATUS_LIST.indexOf(tindakan.status || "Perlu Verifikasi");
            setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
        }
    }, [tindakan]);

    const validateCurrentStep = () => {
        const status = STATUS_LIST[currentStepIndex];

        let requiredFields: string[] = [];

        if (status === "Verifikasi Situasi") {
            requiredFields = ["situasi"];
        } else if (status === "Verifikasi Kelengkapan Berkas") {
            requiredFields = ["trackingId", "url", "status_laporan"];
        } else if (status === "Proses OPD Terkait") {
            requiredFields = ["kesimpulan", "opd"];
        }

        return requiredFields.every((field) =>
            field in formData ? !!formData[field as keyof TindakanClientState] : true
        );
    };

    const saveData = async (nextStatus?: string) => {
        try {
            if (!formData.report) return;

            // Ambil data user login
            const userId = localStorage.getItem('nama_admin');
            if (!userId) {
                setNotif("❌ User belum login.");
                return;
            }

            const updatedData = {
                ...formData,
                updatedAt: new Date().toISOString(),
                status: formData.situasi === "Darurat" ? "Selesai Pengaduan" : nextStatus || formData.status,
                processed_by: userId
            };

            await axios.put(
                `${API_URL}/tindakan/${formData.report}`,
                updatedData
            );
            setFormData(updatedData);
            setSaveSuccessModalVisible(true);
        } catch (err: any) {
            console.error("❌ Gagal menyimpan:", err);
        } finally {
            setTimeout(() => setNotif(null), 3000);
        }
    };

    const processedBy = async () => {
    try {
        if (!formData.report) return;

        // Ambil ID user login (pastikan key-nya benar, misal 'user_id' atau 'userLoginId')
        const userLoginId = localStorage.getItem('user_id');
        if (!userLoginId) {
            setNotif("❌ User belum login.");
            return;
        }

        // PATCH hanya kirim userLoginId saja
        await axios.patch(
            `${API_URL}/tindakan/${formData.report}/processed-by`,
            { userLoginId }
        );

        // Optional: update state lokal kalau mau
        setFormData({
            ...formData,
            processed_by: userLoginId,
        });
    } catch (err) {
        console.error("❌ Gagal menyimpan:", err);
    } finally {
        setTimeout(() => setNotif(null), 3000);
    }
};

    const handleNextStep = async () => {
        if (!validateCurrentStep()) {
            alert("Harap lengkapi semua data terlebih dahulu.");
            return;
        }

        const statusNow = STATUS_LIST[currentStepIndex];
        const nextIndex = currentStepIndex + 1;
        const nextStatus = STATUS_LIST[nextIndex];

        // Step khusus, misal 'Proses OPD Terkait'
        if (statusNow === "Proses OPD Terkait") {
            setShowConfirmModal(true);
            setPendingNextStatus(nextStatus);
            return;
        }

        if (statusNow === "Verifikasi Situasi" && nextStatus === "Verifikasi Kelengkapan Berkas") {
            setShowLaporModal(true);
            setPendingNextStatus(nextStatus);
            return;
        }

        setIsLoading(true);

        // === UPDATE processed_by HANYA DI STEP 1 ===
        if (currentStepIndex === 0) {
            // Step pertama, update processed_by
            await processedBy();
            await saveData(nextStatus);
        } else {
            // Step selain pertama, cukup update data saja
            await saveData(nextStatus);
        }

        setIsLoading(false);
        setCurrentStepIndex(nextIndex);
        router.refresh();
    };

    const handlePreviousStep = async () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex < 0) return;
        const prevStatus = STATUS_LIST[prevIndex];
        await saveData(prevStatus);
        setCurrentStepIndex(prevIndex);
    };

    const StepComponent = STEP_COMPONENTS[currentStepIndex];

    const handlers = useSwipeable({
        onSwipedLeft: () => setActivePhotoIndex((prev) => (prev < (formData.photos?.length || 0) - 1 ? prev + 1 : 0)),
        onSwipedRight: () => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : (formData.photos?.length || 0) - 1)),
        trackMouse: true,
    });

    const NEXT_STEP_LABELS = [
        "Lanjut Verifikasi",
        "Konfirmasi Tindak Lanjut",
        "Tindak Lanjut OPD Terkait",
        "Selesai Penanganan",
        "Selesai Pengaduan",
        "Selesai",
    ];

    const isButtonDisabled =
        isLoading ||
        (currentStepIndex === 2 && !confirmedVerifikasi2) && !formData.trackingId ||
        (currentStepIndex === 3 && !confirmedProses) && !formData.opd ||
        (currentStepIndex === 2 && formData.status_laporan !== "Sedang Diproses OPD Terkait") ||
        (currentStepIndex === 3 && formData.status_laporan !== "Telah Diproses OPD Terkait");

    const tooltipMessage = isLoading
        ? "Sedang memproses..."
        : currentStepIndex === 2 && !confirmedVerifikasi2 && !formData.trackingId
            ? "Konfirmasi Isi Data Ke SP4N Lapor Terlebih Dahulu"
            : currentStepIndex === 3 && !confirmedProses && !formData.opd
                ? "Pastikan Data Tindak Lanjut Sudah Tersedia di SP4N Lapor"
                : currentStepIndex === 2 && formData.status_laporan !== "Sedang Diproses OPD Terkait"
                    ? "Pastikan Status laporan SP4N Lapor sudah 'Sedang Diproses OPD Terkait'"
                    : currentStepIndex === 3 && formData.status_laporan !== "Telah Diproses OPD Terkait"
                        ? "Pastikan Status laporan SP4N Lapor sudah 'Selesai'"
                        : "";

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800 space-y-6">
            {notif && (
                <div className="bg-green-100 text-green-800 border border-green-300 px-4 py-2 rounded mb-4 shadow-sm">
                    {notif}
                </div>
            )}

            {/* Modal Simpan Berhasil */}
            {saveSuccessModalVisible && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]"
                    onClick={() => setSaveSuccessModalVisible(false)}
                >
                    <div
                        className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-gray-700 font-semibold">✅ Data berhasil disimpan.</p>
                        <button
                            onClick={() => setSaveSuccessModalVisible(false)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                        >
                            Oke
                        </button>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            {formData.status === "Ditutup" ? (
                <div className="flex justify-center">
                    <div className="flex flex-col items-center text-xs">
                        <div className="w-8 h-8 rounded-full bg-red-300 text-white flex items-center justify-center font-bold">
                            ❌
                        </div>
                        <span className="mt-1 text-red-600 font-semibold">Ditutup</span>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="relative flex justify-between px-6">
                        {(() => {
                            // Filter status "Ditutup" dari list
                            const STATUS_LIST_FILTERED = STATUS_LIST.filter((s) => s !== "Ditutup");
                            const status = formData.status ?? ""; // Pastikan string
                            const currentStepIndexFiltered = Math.max(
                                0,
                                STATUS_LIST_FILTERED.indexOf(status)
                            );

                            return (
                                <>
                                    {/* Garis dasar (abu-abu) */}
                                    <div
                                        className="absolute top-4 h-1 bg-gray-300 z-0"
                                        style={{
                                            left: `calc((100% / ${STATUS_LIST_FILTERED.length * 2}))`,
                                            right: `calc((100% / ${STATUS_LIST_FILTERED.length * 2}))`,
                                        }}
                                    />

                                    {/* Garis progress (hijau) */}
                                    <div
                                        className="absolute top-4 h-1 bg-green-500 z-0 transition-all duration-300"
                                        style={{
                                            left: `calc((100% / ${STATUS_LIST_FILTERED.length * 2}))`,
                                            width: `calc(((100% / ${STATUS_LIST_FILTERED.length}) * ${currentStepIndexFiltered}))`,
                                        }}
                                    />

                                    {/* Titik-titik progress */}
                                    {STATUS_LIST_FILTERED.map((status, idx) => {
                                        const isDone = idx < currentStepIndexFiltered;
                                        const isCurrent = idx === currentStepIndexFiltered;
                                        const color = statusColors[status] || "#D1D5DB";

                                        return (
                                            <div
                                                key={status}
                                                className="relative flex flex-col items-center min-w-[80px] z-10"
                                            >
                                                {/* Lingkaran */}
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                                    style={{
                                                        backgroundColor: isDone || isCurrent ? color : "#D1D5DB",
                                                        color: isDone || isCurrent ? "white" : "#6B7280",
                                                    }}
                                                >
                                                    {idx + 1}
                                                </div>

                                                {/* Label */}
                                                <div className="mt-2 text-xs break-words text-center max-w-[80px]">
                                                    <span
                                                        className="font-semibold"
                                                        style={{
                                                            color: isCurrent ? color : "#9CA3AF",
                                                        }}
                                                    >
                                                        {status}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Detail Laporan */}
            <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium flex items-center gap-2">
                        Detail Keluhan
                        <button
                            onClick={() => setShowKeluhan((prev) => !prev)}
                            className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                        >
                            {showKeluhan ? "Sembunyikan Detail" : "Lihat Detail"}
                        </button>
                    </h2>
                </div>

                {showKeluhan && (
                    <Keluhan sessionId={sessionId} />
                )}
            </div>

            {/* Step Form */}
            <div className="border-b pb-4">
                {/* Komponen Step */}
                {STATUS_LIST[currentStepIndex] === "Verifikasi Kelengkapan Berkas" ? (
                    <Verifikasi2
                        data={formData}
                        onChange={setFormData}
                        onConfirmChange={(val) => setConfirmedVerifikasi2(val)}
                    />
                ) : STATUS_LIST[currentStepIndex] === "Proses OPD Terkait" ? (
                    <Proses
                        data={formData}
                        onChange={setFormData}
                        onConfirmChange={(val) => setConfirmedProses(val)}
                        saveData={saveData}
                    />
                ) : STATUS_LIST[currentStepIndex] === "Selesai Pengaduan" ? (
                    <Selesai2 data={{ ...formData, sessionId }} />
                ) : STATUS_LIST[currentStepIndex] === "Verifikasi Situasi" ? (
                    <Verifikasi1 data={{ ...formData }} onChange={setFormData} />
                )
                    : (
                        <StepComponent data={{ ...formData, sessionId }} onChange={setFormData} />
                    )}

                {/* Tombol Navigasi */}
                {!["Ditutup", "Selesai Penanganan", "Selesai Pengaduan"].includes(formData.status || "") && (
                    <div className="flex justify-center gap-2 mt-4">
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
                                                    onClick={async () => {
                                                        if (!rejectReason.trim()) {
                                                            alert("Alasan penutupan harus diisi.");
                                                            return;
                                                        }
                                                        try {
                                                            const updated = {
                                                                ...formData,
                                                                status: "Ditutup",
                                                                updatedAt: new Date().toISOString(),
                                                                keterangan: `${rejectReason.trim()}`,
                                                            };
                                                            await axios.put(
                                                                `${API_URL}/tindakan/${formData.report}`,
                                                                updated
                                                            );
                                                            setShowRejectModal(false);
                                                            router.push("/pengaduan");
                                                        } catch (error) {
                                                            alert("Gagal menolak pengaduan. Silakan coba lagi.");
                                                        }
                                                    }}
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
                                className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md flex items-center gap-2"

                            >
                                <GrLinkPrevious size={18} />
                                Kembali
                            </button>
                        )}

                        {/* Tombol Simpan Perubahan (hanya di index 2) */}
                        {[2].includes(currentStepIndex) && (
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    await saveData();
                                    setIsSaving(false);
                                }}
                                disabled={
                                    isSaving ||
                                    (currentStepIndex === 2 && !confirmedVerifikasi2 && !formData.trackingId)
                                }
                                className={`px-4 py-2 rounded-md text-white transition flex items-center gap-2 ${(
                                    (currentStepIndex === 2 && !confirmedVerifikasi2 && !formData.trackingId))
                                    ? "bg-gray-300 cursor-not-allowed"
                                    : "bg-emerald-500 hover:bg-emerald-600"
                                    }`}
                            >
                                {isSaving ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <LoadingSpinner />
                                        <span>Sedang menyimpan...</span>
                                    </div>
                                ) : (
                                    <>
                                        <RiSave3Fill size={18} />
                                        <span>Simpan Perubahan</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Tombol Lanjutkan (dinamis status dan konfirmasi) */}
                        {currentStepIndex < NEXT_STEP_LABELS.length && (

                            <div className="relative group inline-block">
                                <button
                                    onClick={() => handleNextStep()}
                                    disabled={isButtonDisabled}
                                    className={`px-4 py-2 rounded-md text-white transition flex items-center gap-2 ${isButtonDisabled
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-indigo-500 hover:bg-indigo-600"
                                        }`}
                                >
                                    {isLoading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <>
                                            {NEXT_STEP_LABELS[currentStepIndex] || "Lanjutkan"}
                                            <GrLinkNext size={16} />
                                        </>
                                    )}
                                </button>

                                {isButtonDisabled && tooltipMessage && (
                                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
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
                                    className="bg-[rgb(96,165,250)] text-white px-4 py-2 rounded-md flex items-center gap-2"
                                >
                                    <FaCheckDouble size={18} />
                                    Selesai Penanganan
                                </button>

                                {/* Modal Selesai Penanganan */}
                                {showSelesaiModal && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                                        <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                                            <h3 className="text-lg font-semibold text-[rgb(96,165,250)]">Alasan Penyelesaian</h3>
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
                                                    onClick={async () => {
                                                        if (!selesaiReason.trim()) {
                                                            alert("Alasan penyelesaian harus diisi.");
                                                            return;
                                                        }
                                                        try {
                                                            const updated = {
                                                                ...formData,
                                                                status: "Selesai Penanganan",
                                                                updatedAt: new Date().toISOString(),
                                                                keterangan: `${selesaiReason.trim()}`,
                                                            };
                                                            await axios.put(
                                                                `${API_URL}/tindakan/${formData.report}`,
                                                                updated
                                                            );
                                                            setShowSelesaiModal(false);
                                                            router.push("/pengaduan");
                                                        } catch (error) {
                                                            alert("Gagal menyelesaikan pengaduan. Silakan coba lagi.");
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-[rgb(96,165,250)] text-white rounded-md text-sm"
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
                )}
            </div>

            {/* Modal Zoom Foto */}
            {showModal && formData.photos && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center" onClick={() => setShowModal(false)}>
                    <div className="relative bg-white rounded-md p-4 max-w-lg w-[90%] shadow-lg" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowModal(false)} className="absolute top-2 right-3 text-gray-600 hover:text-black text-lg">✕</button>
                        <div {...handlers}>
                            <Zoom>
                                <img src={`${API_URL}${formData.photos[activePhotoIndex]}`} className="w-full h-96 object-contain rounded-md cursor-zoom-in" />
                            </Zoom>
                        </div>
                        <div className="flex justify-between mt-4 text-sm font-medium">
                            <button onClick={() => setActivePhotoIndex((prev) => prev > 0 ? prev - 1 : (formData.photos!.length || 1) - 1)} className="text-blue-600 hover:underline">←</button>
                            <span>Foto {activePhotoIndex + 1} dari {formData.photos?.length}</span>
                            <button onClick={() => setActivePhotoIndex((prev) => prev < (formData.photos!.length || 1) - 1 ? prev + 1 : 0)} className="text-blue-600 hover:underline">→</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Simpan Loading */}
            {isSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4">
                        <LoadingSpinner />
                        <p className="text-gray-700 font-semibold">Sedang menyimpan...</p>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Proses OPD Terkait */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold text-yellow-700">Konfirmasi Lanjutkan Proses</h3>
                        <p className="mb-2 text-sm text-gray-700">
                            Lanjutkan proses ke tahap Selesai Penanganan? Data ini tidak dapat dikembalikan dan akan langsung di teruskan ke Warga.
                        </p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={async () => {
                                    if (pendingNextStatus) {
                                        setIsLoading(true);
                                        await saveData(pendingNextStatus);
                                        setCurrentStepIndex((prev) => prev + 1);
                                        setPendingNextStatus(null);
                                        setShowConfirmModal(false);
                                        setIsLoading(false);
                                    }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm"
                            >
                                Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi SP4N Lapor */}
            {showLaporModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold text-yellow-700">Konfirmasi Tindak Lanjut</h3>
                        <p className="mb-2 text-sm text-gray-700">
                            Yakin data sudah di croscheck{formData.situasi === 'Darurat' ? '' : `, lanjutkan ke SP4N Lapor`}?
                        </p>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowLaporModal(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={async () => {
                                    if (pendingNextStatus) {
                                        await saveData(pendingNextStatus);
                                        setCurrentStepIndex((prev) => formData.situasi === 'Darurat' ? 5 : prev + 1);
                                        setPendingNextStatus(null);
                                        setShowLaporModal(false);

                                        if (currentStepIndex === 1 && formData.situasi !== 'Darurat') {
                                            window.open("https://www.lapor.go.id/", "_blank", "noopener,noreferrer");
                                        }
                                    }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm"
                            >
                                Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

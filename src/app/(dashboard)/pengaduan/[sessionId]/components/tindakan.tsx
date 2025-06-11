"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../../../../utils/axiosInstance";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useSwipeable } from "react-swipeable";
import Keluhan from "./keluhan";
import { TindakanClientState } from "../../../../../lib/types";
import LoadingSpinner from "../../../../../components/LoadingSpinner"

// Step Components
import Verifikasi from "./componentsTindakan/verifikasi";
import Verifikasi1 from "./componentsTindakan/verifikasi1";
import Verifikasi2 from "./componentsTindakan/verifikasi2";
import Proses from "./componentsTindakan/proses";
import Selesai from "./componentsTindakan/selesai";
import Selesai2 from "./componentsTindakan/selesai2";
import Ditolak from "./componentsTindakan/ditolak";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const STATUS_LIST = [
    "Perlu Verifikasi",
    "Verifikasi Situasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
    "Ditolak",
];

const STEP_COMPONENTS = [Verifikasi, Verifikasi1, Verifikasi2, Proses, Selesai, Selesai2, Ditolak];

export default function Tindakan({
    tindakan,
    sessionId,
}: {
    tindakan: TindakanClientState | null;
    sessionId: string;
}) {
    const [formData, setFormData] = useState<Partial<TindakanClientState>>({});
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [showKeluhan, setShowKeluhan] = useState(false);
    const [notif, setNotif] = useState<string | null>(null);
    const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
    const [showLaporModal, setShowLaporModal] = useState(false);
    const [pendingNextStatus, setPendingNextStatus] = useState<string | null>(null);
    const [confirmedVerifikasi2, setConfirmedVerifikasi2] = useState(false);
    const [confirmedProses, setConfirmedProses] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
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
            if (!formData.report) {
                setNotif("❌ Data laporan tidak valid.");
                return;
            }
            const updatedData = {
                ...formData,
                updatedAt: new Date().toISOString(),
                status: formData.situasi === "Darurat" ? "Selesai Pengaduan" : nextStatus || formData.status
            };
            await axios.put(
                `${API_URL}/tindakan/${formData.report}`,
                updatedData
            );
            setFormData(updatedData);
            setSaveSuccessModalVisible(true);
        } catch (err: any) {
            console.error("❌ Gagal menyimpan:", err);
            setNotif("❌ Gagal menyimpan data.");
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

        // Konfirmasi khusus untuk step 'Proses OPD Terkait'
        if (statusNow === "Proses OPD Terkait") {
            setShowConfirmModal(true);
            setPendingNextStatus(nextStatus);
            return;
        }

        // Modal khusus saat pindah ke 'Verifikasi Kelengkapan Berkas'
        if (statusNow === "Verifikasi Situasi" && nextStatus === "Verifikasi Kelengkapan Berkas") {
            setShowLaporModal(true);
            setPendingNextStatus(nextStatus);
            return;
        }

        setIsLoading(true);
        await saveData(nextStatus);
        setIsLoading(false);
        setCurrentStepIndex(nextIndex);

        // Refresh the page after loading finishes
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
        "Terima Laporan",
        "Konfirmasi Tindak Lanjut",
        "Tindak Lanjut OPD Terkait",
        "Selesai Penanganan",
        "Selesai Pengaduan",
        "Selesai",
    ];

    const isButtonDisabled =
        isLoading ||
        (currentStepIndex === 2 && !confirmedVerifikasi2) ||
        (currentStepIndex === 3 && !confirmedProses) ||
        (currentStepIndex === 2 && formData.status_laporan !== "Sedang Diproses OPD Terkait") ||
        (currentStepIndex === 3 && formData.status_laporan !== "Telah Diproses OPD Terkait");

    const tooltipMessage = isLoading
        ? "Sedang memproses..."
        : currentStepIndex === 2 && !confirmedVerifikasi2
            ? "Konfirmasi Isi Data Ke SP4N Lapor Terlebih Dahulu"
            : currentStepIndex === 3 && !confirmedProses
                ? "Pastikan Data Tindak Lanjut Sudah Tersedia di SP4N Lapor"
                : currentStepIndex === 2 && formData.status_laporan !== "Sedang Diproses OPD Terkait"
                    ? "Pastikan Status laporan SP4N Lapor sudah 'Sedang Diproses OPD Terkait'"
                    : currentStepIndex === 3 && formData.status_laporan !== "Telah Diproses OPD Terkait"
                        ? "Pastikan Status laporan SP4N Lapor sudah 'Telah Diproses OPD Terkait'"
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
            {formData.status === "Ditolak" ? (
                <div className="flex justify-center">
                    <div className="flex flex-col items-center text-xs">
                        <div className="w-8 h-8 rounded-full bg-red-300 text-white flex items-center justify-center font-bold">
                            ❌
                        </div>
                        <span className="mt-1 text-red-600 font-semibold">Ditolak</span>
                    </div>
                </div>
            ) : (
                <div className="flex justify-between items-center">
                    {STATUS_LIST.slice(0, -1).map((status, idx) => {
                        const current = idx === currentStepIndex;
                        const done = idx < currentStepIndex;
                        return (
                            <div key={status} className="flex-1 flex flex-col items-center text-xs relative">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10
                                        ${current ? "bg-green-700 text-white" : done ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"}`}
                                >
                                    {idx + 1}
                                </div>
                                <span className={`mt-1 text-center ${current ? "text-green-700 font-semibold" : "text-gray-400"}`}>
                                    {status}
                                </span>
                                {idx < STATUS_LIST.length - 2 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-1 ${done ? "bg-green-500" : "bg-gray-300"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}


            {/* Detail Laporan */}
            <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium flex items-center gap-2">
                        Detail Keluhan
                        {!["Ditolak", "Selesai Penanganan", "Selesai Pengaduan"].includes(STATUS_LIST[currentStepIndex]) && (
                            <button
                                onClick={() => setShowKeluhan((prev) => !prev)}
                                className="text-xs flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                            >
                                {showKeluhan ? "Sembunyikan Detail" : "Lihat Detail"}
                            </button>
                        )}
                    </h2>
                </div>

                {(showKeluhan ||
                    (["Perlu Verifikasi", "Verifikasi Kelengkapan Berkas"].includes(STATUS_LIST[currentStepIndex]) && !confirmedVerifikasi2)) && (
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
                {!["Ditolak", "Selesai Penanganan", "Selesai Pengaduan"].includes(formData.status || "") && (
                    <div className="flex justify-center gap-2 mt-4">
                        {/* Tombol Tolak (hanya di step pertama) */}
                        {currentStepIndex === 0 && (
                            <>
                                <button
                                    onClick={() => {
                                        setRejectReason("");
                                        setShowRejectModal(true);
                                    }}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md"
                                >
                                    Tolak Pengaduan
                                </button>

                                {/* Modal Tolak Pengaduan */}
                                {showRejectModal && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                                        <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                                            <h3 className="text-lg font-semibold text-red-700">Alasan Penolakan</h3>
                                            <textarea
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                placeholder="Masukkan alasan penolakan pengaduan"
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
                                                            alert("Alasan penolakan harus diisi.");
                                                            return;
                                                        }
                                                        try {
                                                            const updated = {
                                                                ...formData,
                                                                status: "Ditolak",
                                                                updatedAt: new Date().toISOString(),
                                                                keterangan: `Pengaduan ditolak karena: ${rejectReason.trim()}`,
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
                                                    Tolak
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
                                className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-md"

                            >
                                Kembali
                            </button>
                        )}

                        {/* Tombol Simpan Perubahan (hanya di index 2 dan 3) */}
                        {[2, 3].includes(currentStepIndex) && (
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    await saveData();
                                    setIsSaving(false);
                                }}
                                disabled={
                                    isSaving ||
                                    (currentStepIndex === 2 && !confirmedVerifikasi2) ||
                                    (currentStepIndex === 3 && !confirmedProses)
                                }
                                className={`px-4 py-2 rounded-md text-white transition ${(
                                    (currentStepIndex === 2 && !confirmedVerifikasi2) ||
                                    (currentStepIndex === 3 && !confirmedProses))
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
                                    "Simpan Perubahan"
                                )}
                            </button>
                        )}

                        {/* Tombol Lanjutkan (dinamis status dan konfirmasi) */}
                        {currentStepIndex < NEXT_STEP_LABELS.length && (
                            <div className="relative group inline-block">
                                <button
                                    onClick={() => handleNextStep()}
                                    disabled={isButtonDisabled}
                                    className={`px-4 py-2 rounded-md text-white transition ${isButtonDisabled
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-indigo-500 hover:bg-indigo-600"
                                        }`}
                                >
                                    {isLoading ? <LoadingSpinner /> : (NEXT_STEP_LABELS[currentStepIndex] || "Lanjutkan")}
                                </button>

                                {isButtonDisabled && tooltipMessage && (
                                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-max bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                                        {tooltipMessage}
                                    </div>
                                )}
                            </div>
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

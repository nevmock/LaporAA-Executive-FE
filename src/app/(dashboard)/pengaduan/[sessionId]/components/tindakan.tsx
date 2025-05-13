"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useSwipeable } from "react-swipeable";
import Keluhan from "./keluhan";
import { TindakanClientState } from "../../../../../lib/types";

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
    const [showLaporModal, setShowLaporModal] = useState(false);
    const [pendingNextStatus, setPendingNextStatus] = useState<string | null>(null);
    const [confirmedVerifikasi2, setConfirmedVerifikasi2] = useState(false);
    const [confirmedProses, setConfirmedProses] = useState(false);

    const router = useRouter();

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
            requiredFields = ["kesimpulan", "opd", "disposisi"  ];
        }

        return requiredFields.every((field) =>
            field in formData ? !!formData[field as keyof TindakanClientState] : true
        );
    };

    const saveData = async (nextStatus?: string) => {
        try {
            const updatedData = {
                ...formData,
                updatedAt: new Date().toISOString(),
                status: nextStatus || formData.status,
            };
            await axios.put(`${API_URL}/tindakan/${formData.report}`, updatedData);
            setFormData(updatedData);
            setNotif("✅ Data berhasil disimpan.");
        } catch (err) {
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

        // Tambahkan konfirmasi hanya untuk langkah "Proses OPD Terkait"
        if (statusNow === "Proses OPD Terkait") {
            const confirmed = confirm("Lanjutkan proses ke tahap Selesai Penanganan? Data ini tidak dapat dikembalikan dan akan langsung di teruskan ke Warga.");
            if (!confirmed) return;
        }

        // ❗ Modal hanya saat pindah ke "Verifikasi Kelengkapan Berkas"
        if (statusNow === "Verifikasi Situasi" && nextStatus === "Verifikasi Kelengkapan Berkas") {
            setShowLaporModal(true);
            setPendingNextStatus(nextStatus);
            return;
        }

        await saveData(nextStatus);
        setCurrentStepIndex(nextIndex);
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

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800 space-y-6">
            {notif && (
                <div className="bg-green-100 text-green-800 border border-green-300 px-4 py-2 rounded mb-4 shadow-sm">
                    {notif}
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
                ) : (
                    STATUS_LIST[currentStepIndex] === "Proses OPD Terkait" ? (
                        <Proses
                            data={formData}
                            onChange={setFormData}
                            onConfirmChange={(val) => setConfirmedProses(val)}
                        />
                    ) : (
                        <StepComponent data={formData} onChange={setFormData} />
                    )

                )}

                {/* Tombol Navigasi */}
                {!["Ditolak", "Selesai Penanganan", "Selesai Pengaduan"].includes(formData.status || "") && (
                    <div className="flex justify-center gap-2 mt-4">
                        {/* Tombol Tolak (hanya di step pertama) */}
                        {currentStepIndex === 0 && (
                            <button
                                onClick={() => {
                                    showPrompt("Masukkan alasan penolakan pengaduan", "Contoh: tidak sesuai ketentuan", async (reason) => {
                                        const updated = {
                                            ...formData,
                                            status: "Ditolak",
                                            updatedAt: new Date().toISOString(),
                                            keterangan: `Pengaduan ditolak karena: ${reason}`,
                                        };
                                        await axios.put(`${API_URL}/tindakan/${formData.report}`, updated);
                                        router.push("/pengaduan");
                                    });
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded-md"
                            >
                                Tolak Pengaduan
                            </button>
                        )}

                        {/* Tombol Kembali (jika bukan step pertama) */}
                        {currentStepIndex > 0 && (
                            <button
                                onClick={handlePreviousStep}
                                className="bg-gray-400 text-white px-4 py-2 rounded-md"
                                
                            >
                                Kembali
                            </button>
                        )}

                        {/* Tombol Simpan Perubahan (hanya di index 2 dan 3) */}
                        {[2, 3].includes(currentStepIndex) && (
                            <button
                                onClick={() => saveData()}
                                disabled={
                                    (currentStepIndex === 2 && !confirmedVerifikasi2) ||
                                    (currentStepIndex === 3 && !confirmedProses)
                                }
                                className={`px-4 py-2 rounded-md text-white transition ${(
                                    (currentStepIndex === 2 && !confirmedVerifikasi2) ||
                                    (currentStepIndex === 3 && !confirmedProses))
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-500 hover:bg-green-600"
                                    }`}
                            >
                                Simpan Perubahan
                            </button>
                        )}

                        {/* Tombol Lanjutkan (dinamis status dan konfirmasi) */}
                        {currentStepIndex < NEXT_STEP_LABELS.length && (
                            <button
                                onClick={handleNextStep}
                                disabled={
                                    (currentStepIndex === 2 && !confirmedVerifikasi2) ||
                                    (currentStepIndex === 3 && !confirmedProses)
                                }
                                className={`px-4 py-2 rounded-md text-white transition ${(
                                    (currentStepIndex === 2 && !confirmedVerifikasi2) ||
                                    (currentStepIndex === 3 && !confirmedProses))
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-500 hover:bg-green-600"
                                    }`}
                            >
                                {NEXT_STEP_LABELS[currentStepIndex] || "Lanjutkan"}
                            </button>
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

            {/* Modal Konfirmasi SP4N Lapor */}
            {showLaporModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md space-y-4">
                        <h3 className="text-lg font-semibold text-yellow-700">Konfirmasi Tindak Lanjut</h3>
                        <p className="mb-2 text-sm text-gray-700">
                            Yakin data sudah di croscheck, lanjutkan ke SP4N Lapor?
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
                                        setCurrentStepIndex((prev) => prev + 1);
                                        setPendingNextStatus(null);
                                        setShowLaporModal(false);

                                        if (currentStepIndex === 1) {
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

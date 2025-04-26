"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useSwipeable } from "react-swipeable";
import Keluhan from "./keluhan";
import { TindakanClientState } from "../../../../lib/types";

// Komponen per langkah
import Verifikasi from "./componentsTindakan/verifikasi";
import Verifikasi2 from "./componentsTindakan/verifikasi2";
import Proses from "./componentsTindakan/proses";
import Selesai from "./componentsTindakan/selesai";
import Selesai2 from "./componentsTindakan/selesai2";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const STATUS_LIST = [
    "Perlu Verifikasi",
    "Verifikasi Kelengkapan Berkas",
    "Proses OPD Terkait",
    "Selesai Penanganan",
    "Selesai Pengaduan",
];

const STEP_FLOW = [
    { label: "Perlu Verifikasi", fields: ["situasi"] },
    { label: "Verifikasi Kelengkapan Berkas", fields: ["trackingId", "opd", "kesimpulan"] },
    { label: "Proses OPD Terkait", fields: ["kesimpulan"] },
    { label: "Selesai Penanganan", fields: [] },
    { label: "Selesai Pengaduan", fields: [] },
];

const STEP_COMPONENTS = [Verifikasi, Verifikasi2, Proses, Selesai, Selesai2];

export default function Tindakan({
    tindakan,
    sessionId,
}: {
    tindakan: TindakanClientState | null;
    sessionId: string;
}) {
    const [formData, setFormData] = useState<Partial<TindakanClientState>>({});
    const [showModal, setShowModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [showKeluhan, setShowKeluhan] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [notif, setNotif] = useState<string | null>(null);

    useEffect(() => {
        if (tindakan) {
            setFormData(tindakan);
            const stepIndex = STATUS_LIST.indexOf(tindakan.status || "Perlu Verifikasi");
            setCurrentStepIndex(stepIndex >= 0 ? stepIndex : 0);
        }
    }, [tindakan]);

    const validateCurrentStep = () => {
        const requiredFields = STEP_FLOW[currentStepIndex].fields;
        return requiredFields.every((field) => !!formData[field as keyof TindakanClientState]);
    };

    const saveData = async (nextStatus?: string) => {
        try {
            const updatedData: Partial<TindakanClientState> = {
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

    const handleSaveDraft = () => saveData();

    const handleNextStep = async () => {
        if (!validateCurrentStep()) {
            alert("Harap lengkapi semua data yang dibutuhkan terlebih dahulu.");
            return;
        }

        // Khusus langkah konfirmasi sebelum lanjut
        if (STATUS_LIST[currentStepIndex] === "Proses OPD Terkait") {
            const confirmed = confirm(
                "Apakah kamu yakin bahwa tindakan ini sudah selesai dan siap dilaporkan kepada pelapor?"
            );
            if (!confirmed) return;
        }

        const nextIndex = currentStepIndex + 1;
        const nextStatus = STATUS_LIST[nextIndex];
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
        onSwipedLeft: () =>
            setActivePhotoIndex((prev) => (prev < (formData.photos?.length || 0) - 1 ? prev + 1 : 0)),
        onSwipedRight: () =>
            setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : (formData.photos?.length || 0) - 1)),
        trackMouse: true,
    });

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800 space-y-6">
            {notif && (
                <div className="bg-green-100 text-green-800 border border-green-300 px-4 py-2 rounded mb-4 shadow-sm">
                    {notif}
                </div>
            )}

            {/* Progress Bar */}
            <div>
                <h2 className="text-lg font-medium mb-2">Progress Tindakan</h2>
                <div className="flex justify-between items-center">
                    {STATUS_LIST.map((status, idx) => {
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
                                {idx < STATUS_LIST.length - 1 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-1 ${done ? "bg-green-500" : "bg-gray-300"}`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detail Laporan */}
            <div className="border-b pb-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-medium">Detail Laporan</h2>
                    <button
                        onClick={() => setShowKeluhan((prev) => !prev)}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {showKeluhan ? "Sembunyikan" : "Lihat"}
                    </button>
                </div>
                {showKeluhan && <Keluhan sessionId={sessionId} />}
            </div>

            {/* Komponen Step Form */}
            <div className="border-b pb-4">
                <h2 className="text-lg font-medium mb-4">Tindakan</h2>
                <StepComponent data={formData} onChange={setFormData} />
                {!["Selesai Penanganan", "Selesai Pengaduan"].includes(STATUS_LIST[currentStepIndex]) && (
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={handleSaveDraft} className="bg-gray-500 text-white px-4 py-2 rounded-md">
                            Simpan sebagai Draft
                        </button>
                        {currentStepIndex > 0 && (
                            <button onClick={handlePreviousStep} className="bg-gray-400 text-white px-4 py-2 rounded-md">
                                Kembali
                            </button>
                        )}
                        {currentStepIndex < STATUS_LIST.length - 1 && (
                            <button onClick={handleNextStep} className="bg-green-500 text-white px-4 py-2 rounded-md">
                                Lanjutkan
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
        </div>
    );
}

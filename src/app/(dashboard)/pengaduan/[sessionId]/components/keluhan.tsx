"use client";
import { useEffect, useState } from "react";
import axios from "../../../../../utils/axiosInstance";
import dynamic from "next/dynamic";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useSwipeable } from "react-swipeable";
import Profile from "./profile";

const MapView = dynamic(() => import("./MapViews"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    sessionId: string;
    message: string;
    location: {
        latitude: number;
        longitude: number;
        description: string;
        desa: string;
        kecamatan: string;
        kabupaten: string;
    };
    photos: string[];
    createdAt: string;
}

export default function Keluhan({ sessionId }: { sessionId: string }) {
    const [data, setData] = useState<Data | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    // Editable states and edit mode toggles
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [editedMessage, setEditedMessage] = useState("");
    const [editedLocation, setEditedLocation] = useState("");

    const [isSavingMessage, setIsSavingMessage] = useState(false);
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [saveMessageSuccess, setSaveMessageSuccess] = useState(false);
    const [saveLocationSuccess, setSaveLocationSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get(`${API_URL}/reports/${sessionId}`)
            .then((res) => {
                setData(res.data || null);
                if (res.data) {
                    setEditedMessage(res.data.message);
                    setEditedLocation(res.data.location.description);
                }
            })
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData(null);
            });
    }, [sessionId]);

    // Save message update
    const saveMessage = async () => {
        if (!data) return;
        setIsSavingMessage(true);
        setSaveError(null);
        try {
            await axios.put(`${API_URL}/reports/${sessionId}`, {
                ...data,
                message: editedMessage,
            });
            setData((prev) => prev ? { ...prev, message: editedMessage } : prev);
            setSaveMessageSuccess(true);
            setIsEditingMessage(false);
            setTimeout(() => setSaveMessageSuccess(false), 2000);
        } catch (error) {
            setSaveError("Gagal menyimpan Isi Laporan.");
        } finally {
            setIsSavingMessage(false);
        }
    };

    // Save location update
    const saveLocation = async () => {
        if (!data) return;
        setIsSavingLocation(true);
        setSaveError(null);
        try {
            await axios.put(`${API_URL}/reports/${sessionId}`, {
                ...data,
                location: {
                    ...data.location,
                    description: editedLocation,
                },
            });
            setData((prev) =>
                prev ? { ...prev, location: { ...prev.location, description: editedLocation } } : prev
            );
            setSaveLocationSuccess(true);
            setIsEditingLocation(false);
            setTimeout(() => setSaveLocationSuccess(false), 2000);
        } catch (error) {
            setSaveError("Gagal menyimpan Lokasi Kejadian.");
        } finally {
            setIsSavingLocation(false);
        }
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert("Teks berhasil disalin ke clipboard");
        });
    };

    useEffect(() => {
        if (saveError) {
            alert(saveError);
            setSaveError(null);
        }
    }, [saveError]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setShowModal(false);
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, []);

    const handlers = useSwipeable({
        onSwipedLeft: () =>
            setActivePhotoIndex((prev) =>
                prev < (data?.photos.length || 0) - 1 ? prev + 1 : 0
            ),
        onSwipedRight: () =>
            setActivePhotoIndex((prev) =>
                prev > 0 ? prev - 1 : (data?.photos.length || 0) - 1
            ),
        trackMouse: true,
    });

    const [locationDetails, setLocationDetails] = useState<any>(null);

    useEffect(() => {
        if (!data) return;

        const fetchLocation = async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.location.latitude}&lon=${data.location.longitude}&zoom=18&addressdetails=1`,
                    {
                        headers: {
                            "Accept-Language": "id",
                        },
                    }
                );
                const result = await res.json();
                setLocationDetails(result);
            } catch (err) {
                console.error("❌ Gagal ambil lokasi:", err);
            }
        };

        fetchLocation();
    }, [data]);

    if (!data) {
        return <p className="text-center text-gray-500">Memuat data Laporan...</p>;
    }

    return (
        <div className="space-y-6 text-sm text-gray-800">
            <Profile sessionId={sessionId} />
            {/* Detail Keluhan */}
            <div className="grid grid-cols-4 gap-2">
                {/* Isi Laporan */}
                <p className="col-span-1 font-medium flex items-center gap-2">
                    Isi Laporan
                    <button
                        onClick={() => setIsEditingMessage((prev) => !prev)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                        {isEditingMessage ? "Batal" : "Edit"}
                    </button>
                    <button
                        onClick={() => copyToClipboard(editedMessage)}
                        className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                    >
                        Salin
                    </button>
                </p>
                <p className="col-span-3">
                    {isEditingMessage ? (
                        <div className="flex items-center gap-2">
                            <textarea
                                value={editedMessage}
                                onChange={(e) => setEditedMessage(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-sm resize-y"
                                rows={3}
                            />
                            <button
                                onClick={saveMessage}
                                disabled={isSavingMessage}
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                            >
                                {isSavingMessage ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    ) : (
                        `: ${data.message}`
                    )}
                </p>

                <p className="col-span-1 font-medium flex items-center gap-2">
                    Lokasi Kejadian
                    <button
                        onClick={() => setIsEditingLocation((prev) => !prev)}
                        className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                        {isEditingLocation ? "Batal" : "Edit"}
                    </button>
                    <button
                        onClick={() => copyToClipboard(editedLocation)}
                        className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                    >
                        Salin
                    </button>
                </p>
                <p className="col-span-3">
                    {isEditingLocation ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editedLocation}
                                onChange={(e) => setEditedLocation(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                            />
                            <button
                                onClick={saveLocation}
                                disabled={isSavingLocation}
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                            >
                                {isSavingLocation ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    ) : (
                        `: ${data.location.description}`
                    )}
                </p>

                <p className="col-span-1 font-medium">Tanggal Kejadian</p>
                <p className="col-span-3">
                    : {new Date(data.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                </p>

                <p className="col-span-1 font-medium">Desa / Kelurahan</p>
                <p className="col-span-3">: {data.location.desa || "-"}</p>

                <p className="col-span-1 font-medium">Kecamatan</p>
                <p className="col-span-3">: {data.location.kecamatan || "-"}</p>

                <p className="col-span-1 font-medium">Kota / Kabupaten</p>
                <p className="col-span-3">: {data.location.kabupaten || "-"}</p>

                {/* Peta Lokasi */}
                <p className="col-span-1 font-medium">Peta Lokasi Kejadian</p>
                <div className="col-span-3">
                    <MapView
                        lat={data.location.latitude}
                        lon={data.location.longitude}
                        description={data.location.description}
                    />
                </div>

                {/* Foto */}
                <p className="col-span-1 font-medium">Bukti Kejadian</p>
                <div className="col-span-3 flex gap-2 flex-wrap">
                    {data.photos.length > 0 ? (
                        data.photos.map((photo, index) => (
                            <img
                                key={index}
                                src={`${API_URL}${photo}`}
                                className="w-24 h-24 object-cover rounded-md cursor-pointer"
                                onClick={() => {
                                    setActivePhotoIndex(index);
                                    setShowModal(true);
                                }}
                            />
                        ))
                    ) : (
                        <p className="text-gray-500">Tidak ada foto</p>
                    )}
                </div>
            </div>

            {/* Modal Zoom & Swipe */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 z-[9999] flex items-center justify-center"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="relative bg-white rounded-md p-4 max-w-lg w-[90%] shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-2 right-3 text-gray-600 hover:text-black text-lg"
                        >
                            ✕
                        </button>
                        <div {...handlers}>
                            <Zoom>
                                <img
                                    src={`${API_URL}${data.photos[activePhotoIndex]}`}
                                    className="w-full h-96 object-contain rounded-md cursor-zoom-in"
                                    alt={`Foto ${activePhotoIndex + 1}`}
                                />
                            </Zoom>
                        </div>
                        <div className="flex justify-between mt-4 text-sm font-medium">
                            <button
                                onClick={() =>
                                    setActivePhotoIndex((prev) =>
                                        prev > 0 ? prev - 1 : data.photos.length - 1
                                    )
                                }
                                className="text-blue-600 hover:underline"
                            >
                                ←
                            </button>
                            <span>
                                Foto {activePhotoIndex + 1} dari {data.photos.length}
                            </span>
                            <button
                                onClick={() =>
                                    setActivePhotoIndex((prev) =>
                                        prev < data.photos.length - 1 ? prev + 1 : 0
                                    )
                                }
                                className="text-blue-600 hover:underline"
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

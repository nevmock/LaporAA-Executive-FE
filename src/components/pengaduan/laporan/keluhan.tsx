"use client";
import { useEffect, useState } from "react";
import axios from "../../../utils/axiosInstance";
import dynamic from "next/dynamic";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { useSwipeable } from "react-swipeable";
import Profile from "./profile";
import dayjs from "dayjs";
import "dayjs/locale/id";

const MapView = dynamic(() => import("./MapViews"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    sessionId: string;
    message: string;
    from: string;
    user: {
        _id: string;
        name: string;
        nik: string;
        address: string;
        email: string;
        jenis_kelamin: string;
        reportHistory: string[];
    };
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

export default function Keluhan({ sessionId, data: propData }: { sessionId: string; data?: any }) {
    const [data, setData] = useState<Data | null>(propData || null);
    const [showModal, setShowModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    // Editable states and edit mode toggles
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingSex, setIsEditingSex] = useState(false);

    const [editedMessage, setEditedMessage] = useState("");
    const [editedLocation, setEditedLocation] = useState("");
    const [editedName, setEditedName] = useState("");
    const [editedSex, setEditedSex] = useState("");

    const [isSavingMessage, setIsSavingMessage] = useState(false);
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingSex, setIsSavingSex] = useState(false);

    const [saveMessageSuccess, setSaveMessageSuccess] = useState(false);
    const [saveLocationSuccess, setSaveLocationSuccess] = useState(false);
    const [saveNameSuccess, setSaveNameSuccess] = useState(false);
    const [saveSexSuccess, setSaveSexSuccess] = useState(false);

    const [saveError, setSaveError] = useState<string | null>(null);

    // Sync state jika propData berubah
    useEffect(() => {
        if (propData) {
            setData(propData);
            setEditedMessage(propData.message || "");
            setEditedLocation(propData.location?.description || "");
            setEditedName(propData.user?.name || "");
            setEditedSex(propData.user?.jenis_kelamin || "");
        }
    }, [propData]);

    const saveName = async () => {
        if (!data) return;
        setIsSavingName(true);
        setSaveError(null);
        try {
            await axios.put(`${API_URL}/reports/${sessionId}`, {
                name: editedName, // ✅ langsung
            });
            setData((prev) =>
                prev ? { ...prev, user: { ...prev.user, name: editedName } } : prev
            );
            setSaveNameSuccess(true);
            setIsEditingName(false);
            setTimeout(() => setSaveNameSuccess(false), 2000);
            window.location.reload();
        } catch (error) {
            setSaveError("Gagal menyimpan Nama.");
        } finally {
            setIsSavingName(false);
        }
    };

    const saveSex = async () => {
        if (!data) return;
        setIsSavingSex(true);
        setSaveError(null);
        try {
            await axios.put(`${API_URL}/reports/${sessionId}`, {
                jenis_kelamin: editedSex, // ✅ langsung
            });
            setData((prev) =>
                prev ? { ...prev, user: { ...prev.user, jenis_kelamin: editedSex } } : prev
            );
            setSaveSexSuccess(true);
            setIsEditingSex(false);
            setTimeout(() => setSaveSexSuccess(false), 2000);
        } catch (error) {
            setSaveError("Gagal menyimpan Jenis Kelamin.");
        } finally {
            setIsSavingSex(false);
        }
    };

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
        if (!data || !data.location) return;
        const { latitude, longitude } = data.location;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
        
        // Use a ref to track if component is still mounted
        let isMounted = true;
        
        // Add cache to prevent redundant fetching
        const cacheKey = `${latitude},${longitude}`;
        const cachedLocation = sessionStorage.getItem(`location_${cacheKey}`);
        
        if (cachedLocation) {
            try {
                setLocationDetails(JSON.parse(cachedLocation));
                return; // Use cached data if available
            } catch (e) {
                // If parsing fails, proceed with fetch
                console.warn("Failed to parse cached location");
            }
        }
        
        const fetchLocation = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
                
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                    {
                        headers: {
                            "Accept-Language": "id",
                            "User-Agent": "LaporAA-Executive-App/1.0"
                        },
                        signal: controller.signal
                    }
                );
                
                clearTimeout(timeoutId);
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const result = await res.json();
                
                if (isMounted) {
                    setLocationDetails(result);
                    // Cache the result
                    sessionStorage.setItem(`location_${cacheKey}`, JSON.stringify(result));
                }
            } catch (err) {
                if (typeof err === "object" && err !== null && "name" in err && (err as { name?: string }).name === 'AbortError') {
                    console.warn("Permintaan lokasi timeout atau dibatalkan");
                } else {
                    console.error("❌ Gagal ambil lokasi:", err);
                }
                // Still set some default data to prevent retrying
                if (isMounted) {
                    setLocationDetails({ display_name: "Lokasi tidak tersedia", error: true });
                }
            }
        };
        
        // Add delay to avoid rate limiting
        const timer = setTimeout(fetchLocation, 500);
        
        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [data?.location?.latitude, data?.location?.longitude]);

    if (!data) {
        return <p className="text-center text-gray-500">Memuat data Laporan...</p>;
    }

    // Layout seragam: gunakan array rows
    const rows = [
        {
            label: "Isi Laporan",
            value: isEditingMessage ? (
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
                <div className="whitespace-pre-wrap text-sm">{data.message}</div>
            ),
            action: (
                <>
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
                </>
            )
        },
        {
            label: "Lokasi Kejadian",
            value: isEditingLocation ? (
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
                data.location.description
            ),
            action: (
                <>
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
                </>
            )
        },
        {
            label: "Tanggal Kejadian",
            value: dayjs(data.createdAt).locale("id").format("D MMMM YYYY, HH:mm") + " WIB"
        },
        {
            label: "Desa / Kelurahan",
            value: data.location.desa || "-",
        },
        {
            label: "Kecamatan",
            value: data.location.kecamatan || "-",
        },
        {
            label: "Kabupaten",
            value: data.location.kabupaten || "-",
        },
        {
            label: "Peta Lokasi Kejadian",
            value: (
                <MapView
                    lat={data.location.latitude}
                    lon={data.location.longitude}
                    description={data.location.description}
                />
            ),
        },
        {
            label: "Bukti Kejadian",
            value: data.photos.length > 0 ? (
                <div className="flex gap-2 flex-wrap">
                    {data.photos.map((photo, index) => (
                        <img
                            key={index}
                            src={`${API_URL}${photo}`}
                            className="w-24 h-24 object-cover rounded-md cursor-pointer"
                            onClick={() => {
                                setActivePhotoIndex(index);
                                setShowModal(true);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">Tidak ada foto</p>
            )
        }
    ];

    return (
        <div className="border rounded-md overflow-hidden">
            <div className="border-b px-6 py-3 bg-gray-50">
                <h2 className="text-base font-semibold">Detail Laporan</h2>
            </div>
            <div>
                {rows.map((item, index) => (
                    <div
                        key={index}
                        className={`grid grid-cols-12 items-center px-4 py-3 border-b ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                    >
                        <div className="col-span-3 font-medium">{item.label}</div>
                        <div className="col-span-7 break-words">{item.value}</div>
                        <div className="col-span-2 flex gap-1 justify-end">{item.action}</div>
                    </div>
                ))}
            </div>
            {/* Modal Foto (tidak berubah) */}
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
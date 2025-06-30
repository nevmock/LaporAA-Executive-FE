"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "../../../utils/axiosInstance";
import dynamic from "next/dynamic";
import Zoom from "react-medium-image-zoom";
// import "react-medium-image-zoom/dist/styles.css"; // Moved to globals.css
import { useSwipeable } from "react-swipeable";
import Profile from "./profile";
import dayjs from "dayjs";
import "dayjs/locale/id";
import PhotoDownloader, { usePhotoDownloader } from "../PhotoDownloader";

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
    
    // Hook untuk download foto
    const { downloadPhoto, downloadMultiplePhotos } = usePhotoDownloader();

    // Editable states and edit mode toggles
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isEditingName, setIsEditingName] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isEditingSex, setIsEditingSex] = useState(false);

    const [editedMessage, setEditedMessage] = useState("");
    const [editedLocation, setEditedLocation] = useState("");
    const [editedName, setEditedName] = useState("");
    const [editedSex, setEditedSex] = useState("");

    const [isSavingMessage, setIsSavingMessage] = useState(false);
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isSavingName, setIsSavingName] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isSavingSex, setIsSavingSex] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [saveMessageSuccess, setSaveMessageSuccess] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [saveLocationSuccess, setSaveLocationSuccess] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [saveNameSuccess, setSaveNameSuccess] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
            setSaveError("Gagal menyimpan Nama.");
        } finally {
            setIsSavingName(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
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
        } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
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
        } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
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

    // Handler untuk download foto individual
    const handleDownloadSinglePhoto = async (photoPath: string, index: number) => {
        if (!data) return;
        
        try {
            await downloadPhoto(data.sessionId, data.user.name, photoPath, index);
            alert(`Foto ${index + 1} berhasil didownload`);
        } catch (error) {
            console.error('Error downloading photo:', error);
            alert(`Gagal mendownload foto ${index + 1}`);
        }
    };

    // Handler untuk download semua foto
    const handleDownloadAllPhotos = async () => {
        if (!data || !data.photos.length) {
            alert('Tidak ada foto untuk didownload');
            return;
        }
        
        if (confirm(`Download ${data.photos.length} foto?`)) {
            try {
                await downloadMultiplePhotos(data.sessionId, data.user.name, data.photos);
                alert(`${data.photos.length} foto berhasil didownload`);
            } catch (error) {
                console.error('Error downloading photos:', error);
                alert('Gagal mendownload foto');
            }
        }
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [locationDetails, setLocationDetails] = useState<{
        description?: string;
        display_name?: string;
        error?: boolean;
        coordinates?: { lat: number; lng: number };
    } | null>(null);

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
                        <div key={index} className="relative group">
                            <Image
                                src={`${API_URL}${photo}`}
                                alt={`Photo ${index + 1}`}
                                className="w-24 h-24 object-cover rounded-md cursor-pointer"
                                width={96}
                                height={96}
                                onClick={() => {
                                    setActivePhotoIndex(index);
                                    setShowModal(true);
                                }}
                            />
                            {/* Download button overlay */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadSinglePhoto(photo, index);
                                }}
                                className="absolute top-1 right-1 bg-black bg-opacity-70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                title={`Download foto ${index + 1}`}
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">Tidak ada foto</p>
            ),
            action: data.photos.length > 1 ? (
                <button
                    onClick={handleDownloadAllPhotos}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                    title="Download semua foto"
                >
                    Download Semua
                </button>
            ) : undefined
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
            {/* Modal Foto dengan fitur download */}
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
                            className="absolute top-2 right-3 text-gray-600 hover:text-black text-lg z-10"
                        >
                            ✕
                        </button>
                        
                        {/* Download button for current photo */}
                        <button
                            onClick={() => handleDownloadSinglePhoto(data.photos[activePhotoIndex], activePhotoIndex)}
                            className="absolute top-2 left-3 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 transition-colors z-10"
                            title={`Download foto ${activePhotoIndex + 1}`}
                        >
                            Download
                        </button>
                        
                        <div {...handlers}>
                            <Zoom>
                                <Image
                                    src={`${API_URL}${data.photos[activePhotoIndex]}`}
                                    className="w-full h-96 object-contain rounded-md cursor-zoom-in"
                                    alt={`Foto ${activePhotoIndex + 1}`}
                                    width={800}
                                    height={384}
                                />
                            </Zoom>
                        </div>
                        <div className="flex justify-between items-center mt-4 text-sm font-medium">
                            <button
                                onClick={() =>
                                    setActivePhotoIndex((prev) =>
                                        prev > 0 ? prev - 1 : data.photos.length - 1
                                    )
                                }
                                className="text-blue-600 hover:underline text-lg"
                            >
                                ←
                            </button>
                            <div className="flex flex-col items-center gap-2">
                                <span>
                                    Foto {activePhotoIndex + 1} dari {data.photos.length}
                                </span>
                                {data.photos.length > 1 && (
                                    <button
                                        onClick={handleDownloadAllPhotos}
                                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                                    >
                                        Download Semua Foto
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() =>
                                    setActivePhotoIndex((prev) =>
                                        prev < data.photos.length - 1 ? prev + 1 : 0
                                    )
                                }
                                className="text-blue-600 hover:underline text-lg"
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
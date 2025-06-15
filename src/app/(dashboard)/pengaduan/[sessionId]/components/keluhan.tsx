"use client";
import { useEffect, useState } from "react";
import axios from "../../../../../utils/axiosInstance";
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

export default function Keluhan({ sessionId }: { sessionId: string }) {
    const [data, setData] = useState<Data | null>(null);
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

    useEffect(() => {
        axios
            .get(`${API_URL}/reports/${sessionId}`)
            .then((res) => {
                setData(res.data || null);
                if (res.data) {
                    setEditedMessage(res.data.message);
                    setEditedLocation(res.data.location.description);
                    setEditedName(res.data.user.name);
                    setEditedSex(res.data.user.jenis_kelamin);
                }
            })
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData(null);
            });
    }, [sessionId]);

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
        <div className="space-y-1 text-sm text-gray-800">
            {[
                {
                    label: "No. Telepon",
                    value: data.from || "-",
                },
                {
                    label: "Nama Pelapor",
                    value: isEditingName ? (
                        <div className="flex items-center gap-2">
                            <textarea
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                            />
                            <button
                                onClick={saveName}
                                disabled={isSavingName}
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                            >
                                {isSavingName ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    ) : (
                        data.user.name
                    ),
                    action: (
                        <>
                            <button
                                onClick={() => setIsEditingName((prev) => !prev)}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                            >
                                {isEditingName ? "Batal" : "Edit"}
                            </button>
                            <button
                                onClick={() => copyToClipboard(editedName)}
                                className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                            >
                                Salin
                            </button>
                        </>
                    )
                },
                {
                    label: "Jenis Kelamin",
                    value: isEditingSex ? (
                        <div className="flex items-center gap-2">
                            <select
                                value={editedSex}
                                onChange={(e) => setEditedSex(e.target.value)}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                            >
                                <option value="">-- Pilih Jenis Kelamin --</option>
                                <option value="pria">pria</option>
                                <option value="wanita">wanita</option>
                            </select>
                            <button
                                onClick={saveSex}
                                disabled={isSavingSex}
                                type="button"
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                            >
                                {isSavingSex ? "Menyimpan..." : "Simpan"}
                            </button>
                        </div>
                    ) : (
                        data.user.jenis_kelamin || "-"
                    ),
                    action: (
                        <>
                            <button
                                onClick={() => setIsEditingSex((prev) => !prev)}
                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                            >
                                {isEditingSex ? "Batal" : "Edit"}
                            </button>
                            <button
                                onClick={() => copyToClipboard(editedSex)}
                                className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded"
                            >
                                Salin
                            </button>
                        </>
                    )
                },
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
                        data.message
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
            ].map((item, index) => (
                <div
                    key={index}
                    className={`grid grid-cols-12 items-start px-4 py-3 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                >
                    <div className="col-span-3 font-medium">{item.label}</div>
                    <div className="col-span-7 break-words">{item.value}</div>
                    <div className="col-span-2 flex gap-1 justify-end">{item.action}</div>
                </div>
            ))}

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
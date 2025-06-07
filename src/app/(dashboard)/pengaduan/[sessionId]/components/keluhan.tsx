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

    useEffect(() => {
        axios
            .get(`${API_URL}/reports/${sessionId}`)
            .then((res) => setData(res.data || null))
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData(null);
            });
    }, [sessionId]);

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
                <p className="col-span-1 font-medium">Isi Laporan</p>
                <p className="col-span-3">: {data.message}</p>

                <p className="col-span-1 font-medium">Tanggal Kejadian</p>
                <p className="col-span-3">
                    : {new Date(data.createdAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                </p>

                <p className="col-span-1 font-medium">Lokasi Kejadian</p>
                <p className="col-span-3">: {data.location.description}</p>

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
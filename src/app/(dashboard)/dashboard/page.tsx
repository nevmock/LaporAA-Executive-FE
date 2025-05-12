"use client";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import axios from "axios";

import EfisiensiCard from "./components/EfisiensiCard";
import EffectivenessCard from "./components/EffectivenessCard";
import DistribusiCard from "./components/DistribusiCard";
import KepuasanCard from "./components/KepuasanCard";
import EffectivenessChart from "@/app/(dashboard)/dashboard/components/EffectivenessChart";


const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

const MapPersebaran = dynamic(() => import("./components/MapPersebaran"), { ssr: false });

export default function Home() {

    const [countPending, setCountPending] = useState(0);

    useEffect(() => {
        axios
            .get(`${API_URL}/reportCount`)
            .then((res) => {
                const data = res.data?.count ?? 0;
                console.info("Jumlah laporan:", data);
                setCountPending(data);
            })
            .catch((err) => {
                console.error("Gagal mengambil jumlah laporan:", err);
                setCountPending(0);
            });
    }, []);

    return (
        <div className="w-full h-screen bg-white p-6 overflow-hidden flex flex-col">
    
            {/* Statistik Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <EfisiensiCard />
                <EffectivenessCard />
                <DistribusiCard />
                <KepuasanCard />
            </div>

            {/* Effectiveness Chart Container */}
            <div className="flex-1 bg-gray-200 rounded-xl shadow overflow-hidden">
                <EffectivenessChart />
            </div>

            {/* Maps Container */}
            <div className="flex-1 bg-gray-200 rounded-xl shadow overflow-hidden">
                <MapPersebaran />
            </div>
        </div>
    );    
}

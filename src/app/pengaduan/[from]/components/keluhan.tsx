"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    senderName: string;
    senderPhone: string;
    senderEmail: string;
    senderAddress: string;
    senderStatus: string;
}

export default function Keluhan({ from }: { from: string }) {

    const [data, setData] = useState<Data[]>([]);

    useEffect(() => {
        axios
            .get(`${API_URL}/chat`)
            .then((res) => {
                // Pastikan isi dari res.data itu array
                const responseData = Array.isArray(res.data) ? res.data : res.data?.data || [];
                setData(responseData);
                console.log("✅ res.data:", res.data);
            })
            .catch((err) => {
                console.error(err);
                setData([]); // fallback safe
            });
    }, []);

    const selectedUser = data.find((item) => item._id === from);

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800">
            <div className="grid grid-cols-4 gap-2 mb-4">
                <p className="col-span-1 font-medium">Keluhan</p>
                <p className="col-span-3">: {selectedUser?.senderName}</p>

                <p className="col-span-1 font-medium">Lokasi</p>
                <p className="col-span-3">: {selectedUser?._id}
                <div className="w-full max-w-sm h-48 bg-gray-300 rounded-md" />
                </p>

                <p className="col-span-1 font-medium">Foto</p>
                <p className="col-span-3">: {selectedUser?._id}
                <div className="w-full max-w-sm h-48 bg-gray-300 rounded-md" />
                </p>

            </div>
        </div>
    );
}

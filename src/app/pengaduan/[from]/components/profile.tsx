"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    senderName: string;
    senderPhone: string;
    senderEmail: string;
    senderAddress: string;
    senderStatus: string;
}

export default function Profile({ from }: { from: string }) {

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
                <p className="col-span-1 font-medium">Nama</p>
                <p className="col-span-3">: {selectedUser?.senderName}</p>

                <p className="col-span-1 font-medium">Nomor Telepon</p>
                <p className="col-span-3">: {selectedUser?._id}</p>

                <p className="col-span-1 font-medium">Jenis Kelamin</p>
                <p className="col-span-3">: Laki-laki</p>

                <p className="col-span-1 font-medium">Alamat</p>
                <p className="col-span-3">
                    : Sentra Summarecon Bekasi, Jl. Boulevard Ahmad Yani, Marga Mulya, Kec. Bekasi Utara, Kota Bks, Jawa Barat 17142
                </p>

                <p className="col-span-1 font-medium">KTP</p>
                <div className="col-span-3">
                    <div className="w-full max-w-sm h-48 bg-gray-300 rounded-md" />
                </div>
            </div>
        </div>
    );
}

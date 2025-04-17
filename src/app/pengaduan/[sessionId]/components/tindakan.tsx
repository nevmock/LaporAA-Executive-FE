"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

interface Data {
    _id: string;
    createdAt: string;
    hasil: string;
    kesimpulan: string;
    opd: string;
    photos: string[];
    situasi: string;
    status: string;
    updatedAt: string;
}

export default function Tindakan({ _id }: { _id: string }) {
    const [data, setData] = useState<Data[]>([]);
    const [formData, setFormData] = useState<Partial<Data>>({}); // State untuk form edit
    const [originalData, setOriginalData] = useState<Partial<Data>>({}); // State untuk menyimpan data asli sebelum edit

    useEffect(() => {
        axios
            .get(`${API_URL}/tindakan/${_id}`)
            .then((res) => {
                const responseData = Array.isArray(res.data) ? res.data : [];
                console.info("✅ Tindakan data:", responseData);
                setData(responseData);
                if (responseData.length > 0) {
                    setFormData(responseData[0]); // Isi form dengan data terbaru
                    setOriginalData(responseData[0]); // Simpan data asli
                }
            })
            .catch((err) => {
                console.error("❌ API Error:", err);
                setData([]);
            });
    }, [_id]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const previousCreatedAt = formData.createdAt || new Date().toISOString();

        // Data baru yang akan dibuat
        const newEntry = {
            ...formData,
            reportId: _id, // Sertakan reportId dari props
            createdAt: previousCreatedAt, // Tetap gunakan createdAt dari data asli
            updatedAt: new Date().toISOString(), // Perbarui updatedAt
        };

        // Simpan data baru sebagai entri baru
        axios
            .post(`${API_URL}/tindakan`, newEntry) // Simpan data baru
            .then((res) => {
                console.info("✅ Tindakan created:", res.data);
                setData((prev) => [res.data, ...prev]); // Tambahkan entri baru ke array
                setOriginalData(res.data); // Perbarui data asli
            })
            .catch((err) => {
                console.error("❌ Create Error:", err);
            });
    };

    const handleCancel = () => {
        setFormData(originalData); // Kembalikan form ke data asli
    };

    if (data.length === 0) {
        return <p className="text-center text-gray-500">Memuat data tindakan...</p>;
    }

    // History (semua data kecuali data terbaru)
    const history = data.slice(1);

    return (
        <div className="p-6 bg-gray-100 text-sm text-gray-800">
            {/* Data Terbaru */}
            <div className="mb-6 border-b pb-4">
                <h2 className="text-lg font-medium mb-4">Data Terbaru</h2>
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <label className="col-span-1 font-medium">Kesimpulan</label>
                    <textarea
                        name="kesimpulan"
                        value={formData.kesimpulan || ""}
                        onChange={handleFormChange}
                        className="col-span-3 border p-2 rounded-md"
                    />

                    <label className="col-span-1 font-medium">Hasil</label>
                    <textarea
                        name="hasil"
                        value={formData.hasil || ""}
                        onChange={handleFormChange}
                        className="col-span-3 border p-2 rounded-md"
                    />

                    <label className="col-span-1 font-medium">OPD</label>
                    <input
                        name="opd"
                        value={formData.opd || ""}
                        onChange={handleFormChange}
                        className="col-span-3 border p-2 rounded-md"
                    />

                    <label className="col-span-1 font-medium">Situasi</label>
                    <select
                        name="situasi"
                        value={formData.situasi || ""}
                        onChange={handleFormChange}
                        className="col-span-3 border p-2 rounded-md"
                    >
                        <option value="Darurat">Darurat</option>
                        <option value="Permintaan Informasi">Permintaan Informasi</option>
                        <option value="Berpengawasan">Berpengawasan</option>
                        <option value="Tidak Berpengawasan">Tidak Berpengawasan</option>
                    </select>

                    <label className="col-span-1 font-medium">Status</label>
                    <select
                        name="status"
                        value={formData.status || ""}
                        onChange={handleFormChange}
                        className="col-span-3 border p-2 rounded-md"
                    >
                        <option value="Verifikasi Data">Verifikasi Data</option>
                        <option value="Dalam Proses">Dalam Proses</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Proses Ulang">Proses Ulang</option>
                    </select>

                    <label className="col-span-1 font-medium">Tanggal Dibuat</label>
                    <p className="col-span-3">{new Date(formData.createdAt || "").toLocaleString()}</p>

                    <label className="col-span-1 font-medium">Tanggal Diperbarui</label>
                    <p className="col-span-3">{new Date(formData.updatedAt || "").toLocaleString()}</p>
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        className="bg-gray-500 text-white px-4 py-2 rounded-md"
                        onClick={handleCancel}
                    >
                        Batalkan
                    </button>
                    <button
                        className="bg-green-500 text-white px-4 py-2 rounded-md"
                        onClick={handleSave}
                    >
                        Simpan
                    </button>
                </div>
            </div>

            {/* History */}
            <div>
                <h2 className="text-lg font-medium mb-4">History</h2>
                {history.map((item) => (
                    <div key={item._id} className="mb-6 border-b pb-4">
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            <p className="col-span-1 font-medium">Kesimpulan</p>
                            <p className="col-span-3">: {item.kesimpulan}</p>

                            <p className="col-span-1 font-medium">Hasil</p>
                            <p className="col-span-3">: {item.hasil}</p>

                            <p className="col-span-1 font-medium">OPD</p>
                            <p className="col-span-3">: {item.opd}</p>

                            <p className="col-span-1 font-medium">Situasi</p>
                            <p className="col-span-3">: {item.situasi}</p>

                            <p className="col-span-1 font-medium">Status</p>
                            <p className="col-span-3">: {item.status}</p>

                            <p className="col-span-1 font-medium">Tanggal Dibuat</p>
                            <p className="col-span-3">: {new Date(item.createdAt).toLocaleString()}</p>

                            <p className="col-span-1 font-medium">Tanggal Diperbarui</p>
                            <p className="col-span-3">: {new Date(item.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
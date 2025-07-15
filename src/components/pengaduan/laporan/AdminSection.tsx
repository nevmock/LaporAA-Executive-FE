"use client";

import React, { useState } from 'react';
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { TindakanClientState } from "../../../lib/types";
import axios from "../../../utils/axiosInstance";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import AdminSelector from './AdminSelector';

interface AdminSectionProps {
    formData: TindakanClientState;
    setFormData: (data: TindakanClientState) => void;
    setNotif: (message: string) => void;
    setIsSaving: (value: boolean) => void;
    router: AppRouterInstance;
    API_URL: string;
}

const AdminSection = ({ 
    formData, 
    setFormData, 
    setNotif, 
    setIsSaving, 
    router, 
    API_URL 
}: AdminSectionProps) => {
    const [showAdmin, setShowAdmin] = useState(false);

    return (
        <div className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        Detail Admin
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                            {formData.processed_by?.nama_admin || 'Belum Ditentukan'}
                        </span>
                    </h2>
                    <button
                        onClick={() => setShowAdmin((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                    >
                        {showAdmin ? (
                            <>
                                <FaEyeSlash size={12} />
                                Sembunyikan
                            </>
                        ) : (
                            <>
                                <FaEye size={12} />
                                Lihat Detail
                            </>
                        )}
                    </button>
                </div>
            </div>
            {showAdmin && (
                <div className="p-6 bg-gradient-to-br from-emerald-50/30 to-teal-50/20">
                    <AdminSelector 
                        currentAdmin={formData.processed_by} 
                        API_URL={API_URL}
                        onSave={(selectedAdmin) => {
                            if (selectedAdmin && formData.report) {
                                setIsSaving(true);
                                
                                // Call the update API with the selected admin
                                axios.patch(`${API_URL}/tindakan/${formData.report}/processed-by`, {
                                    userLoginId: selectedAdmin._id
                                })
                                .then(response => {
                                    // Update formData with the processed_by data from response
                                    setFormData({
                                        ...formData,
                                        processed_by: response.data?.processed_by || selectedAdmin
                                    });
                                    
                                    // Show success notification
                                    setNotif("✅ Admin berhasil diperbarui");
                                    
                                    // Refresh router to ensure changes are reflected in the UI
                                    router.refresh();
                                })
                                .catch(error => {
                                    setNotif("❌ Gagal memperbarui admin: " + 
                                        (error.response?.data?.message || error.message || "Unknown error"));
                                })
                                .finally(() => {
                                    setIsSaving(false);
                                });
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminSection;

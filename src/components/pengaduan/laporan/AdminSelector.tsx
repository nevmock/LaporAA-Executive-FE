"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ProcessedBy } from "../../../lib/types";
import axios from "../../../utils/axiosInstance";
import { FaSave, FaUserCog } from "react-icons/fa";

// AdminSelector Component
interface AdminUser {
    _id: string;
    username: string;
    role: string;
    nama_admin: string;
}

interface AdminSelectorProps {
    currentAdmin: ProcessedBy | undefined;
    onSave: (admin: AdminUser) => void;
    API_URL: string;
}

const AdminSelector = ({ currentAdmin, onSave, API_URL }: AdminSelectorProps) => {
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [currentAdminDisplay, setCurrentAdminDisplay] = useState<string>('-');
    const [responseAdmin, setResponseAdmin] = useState<ProcessedBy | null>(null);
    const [error, setError] = useState<string>('');

    // Function to get admin display string - focus on nama_admin as shown in the API response
    const getAdminDisplayString = useCallback((admin: ProcessedBy | undefined): string => {
        if (!admin) return '-';
        return admin.nama_admin || admin.username || '-';
    }, []);
    
    // Initialize currentAdminDisplay based on currentAdmin's nama_admin field
    useEffect(() => {
        // Use responseAdmin as the first choice if available (from API response)
        const adminToDisplay = responseAdmin || currentAdmin;
        setCurrentAdminDisplay(getAdminDisplayString(adminToDisplay));
    }, [currentAdmin, responseAdmin, getAdminDisplayString]);
    
    // Fetch admin list
    useEffect(() => {
        setLoading(true);
        setError('');
        
        axios.get(`${API_URL}/userLogin`)
            .then(response => {
                if (Array.isArray(response.data)) {
                    setAdmins(response.data);
                    
                    // Try to pre-select the current admin in the dropdown based on _id
                    const adminToMatch = responseAdmin || currentAdmin;
                    
                    // If we have a valid object with an _id, try to match it in the dropdown
                    if (adminToMatch && typeof adminToMatch === 'object' && adminToMatch._id) {
                        const matchedAdmin = response.data.find((a: AdminUser) => a._id === adminToMatch._id);
                        if (matchedAdmin) {
                            setSelectedAdmin(matchedAdmin);
                        }
                    }
                } else {
                    setError('Format data admin tidak valid');
                }
            })
            .catch(() => {
                setError('Gagal memuat daftar admin');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [API_URL, currentAdmin, responseAdmin]);
    
    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Saat Ini
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <FaUserCog className="text-gray-600 text-sm" />
                            </div>
                            <span className="text-gray-900 font-medium">{currentAdminDisplay}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}
            
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <FaUserCog className="text-blue-600" />
                        Ubah Admin Pengelola
                    </h3>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Admin Baru
                        </label>
                        {loading ? (
                            <div className="bg-gray-100 p-4 rounded-lg animate-pulse flex items-center justify-center">
                                <span className="inline-block h-4 w-4 border-2 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></span>
                                <span className="text-gray-600">Memuat daftar admin...</span>
                            </div>
                        ) : (
                            <select 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                value={selectedAdmin?._id || ""}
                                onChange={(e) => {
                                    const selected = admins.find(a => a._id === e.target.value);
                                    setSelectedAdmin(selected || null);
                                }}
                            >
                                <option value="">-- Pilih Admin --</option>
                                {admins.map(admin => (
                                    <option key={admin._id} value={admin._id}>
                                        {admin.nama_admin || admin.username} ({admin.role})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    
                    <button
                        className={`w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                            loading || !selectedAdmin 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow'
                        }`}
                        disabled={loading || !selectedAdmin}
                        onClick={() => {
                            if (selectedAdmin) {
                                // Update the responseAdmin state after successful save
                                onSave(selectedAdmin);
                                // Set this admin as the responseAdmin to ensure UI is consistent
                                setResponseAdmin(selectedAdmin);
                            }
                        }}
                    >
                        <FaSave />
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSelector;

"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { RiSave3Fill, RiCloseLine } from "react-icons/ri";
import { TindakanData } from "../../../../lib/types";
import axios from "../../../../utils/axiosInstance";

export default function Verifikasi1({
    data,
    onChange,
    saveData,
}: {
    data: Partial<TindakanData>;
    onChange: React.Dispatch<React.SetStateAction<Partial<TindakanData>>>;
    saveData?: (nextStatus?: string) => Promise<any>;
}) {
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false);
    const [saveMessage, setSaveMessage] = useState("Data berhasil disimpan");
    const [initialData, setInitialData] = useState<Partial<TindakanData>>({});
    const [hasFormChanges, setHasFormChanges] = useState(false);
    
    // State untuk menangani tag/hashtag
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [isTagLoading, setIsTagLoading] = useState(false);
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [isSearchingTags, setIsSearchingTags] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Track initial form data for change detection
    useEffect(() => {
        if (data && Object.keys(data).length > 0 && Object.keys(initialData).length === 0) {
            setInitialData({ ...data });
        }
        
        // Load existing tags if available
        // Handle different formats of tag data
        if (data.tags && Array.isArray(data.tags)) {
            // If tags are already an array of strings
            setTags(data.tags);
        } else if (data.tag && Array.isArray(data.tag)) {
            // If tags are in format { hash_tag: string }[]
            const extractedTags = data.tag.map((tagObj: any) => 
                tagObj.hash_tag || tagObj.toString()
            );
            setTags(extractedTags);
            // Also update parent state for consistency
            onChange(prev => ({ ...prev, tags: extractedTags }));
        } else if (data.tags) {
            // Fallback if tags is not in array format
            setTags([String(data.tags)]);
        }
        
        // Debug output
        console.log("Tag data:", { tags: data.tags, tag: data.tag });
    }, [data, initialData]);

    // Check for form changes whenever data changes
    useEffect(() => {
        if (Object.keys(initialData).length > 0) {
            const situasiChanged = initialData.situasi !== data.situasi;
            // Tags changes should not affect the "Save Changes" button
            // as they're saved automatically when added/removed
            setHasFormChanges(situasiChanged);
        }
    }, [data, initialData]);
    
    // Fungsi untuk menambahkan tag
    const addTag = async (tag: string) => {
        if (!tag.trim()) return;
        if (tags.includes(tag.trim())) return; // Hindari duplikat
        
        if (!data.tindakanId && !data._id) {
            console.error("ID tindakan tidak tersedia, tidak dapat menambahkan tag");
            return;
        }
        
        // Gunakan tindakanId jika tersedia, atau fallback ke _id
        const tindakanId = data.tindakanId || data._id;
        const trimmedTag = tag.trim();
        
        try {
            setIsTagLoading(true);
            
            // Kirim tag ke API menggunakan axios instance yang dikonfigurasi
            const response = await axios.post(`/tindakan/${tindakanId}/tag`, {
                hash_tag: trimmedTag
            });
            
            // Update state lokal
            const newTags = [...tags, trimmedTag];
            setTags(newTags);
            setTagInput("");
            
            // Update parent state untuk kedua format
            onChange(prev => {
                // Update format lama (tags array)
                const updatedState = { ...prev, tags: newTags };
                
                // Update format baru (tag objects array) jika sudah ada
                if (prev.tag) {
                    // Ambil ID tag dari response jika tersedia
                    const tagId = response?.data?._id || new Date().getTime().toString();
                    
                    // Tambahkan tag baru ke array yang sudah ada
                    updatedState.tag = [
                        ...(Array.isArray(prev.tag) ? prev.tag : []),
                        { hash_tag: trimmedTag, _id: tagId }
                    ];
                }
                
                return updatedState;
            });
            
            console.log("Tag berhasil ditambahkan:", trimmedTag);
        } catch (error) {
            console.error("Error adding tag:", error);
            alert("Gagal menambahkan tag. Silakan coba lagi.");
        } finally {
            setIsTagLoading(false);
        }
    };
    
    // Fungsi untuk menghapus tag
    const removeTag = async (tagToRemove: string) => {
        if (!data.tindakanId && !data._id) {
            console.error("ID tindakan tidak tersedia, tidak dapat menghapus tag");
            return;
        }
        
        // Gunakan tindakanId jika tersedia, atau fallback ke _id
        const tindakanId = data.tindakanId || data._id;
        
        try {
            setIsTagLoading(true);
            
            // Kirim permintaan hapus tag ke API menggunakan endpoint yang benar
            // Format: DELETE /tindakan/:tindakanId/tag/:tagName
            await axios.delete(`/tindakan/${tindakanId}/tag/${encodeURIComponent(tagToRemove)}`);
            
            // Update state lokal
            const newTags = tags.filter(tag => tag !== tagToRemove);
            setTags(newTags);
            
            // Update parent state untuk kedua format
            onChange(prev => {
                // Update format lama (tags array)
                const updatedState = { ...prev, tags: newTags };
                
                // Update format baru (tag objects array) jika sudah ada
                if (prev.tag && Array.isArray(prev.tag)) {
                    updatedState.tag = prev.tag.filter(tagItem => {
                        // Handle jika tag adalah object dengan hash_tag
                        if (typeof tagItem === 'object' && tagItem !== null && 'hash_tag' in tagItem) {
                            return tagItem.hash_tag !== tagToRemove;
                        }
                        // Handle jika tag adalah string
                        return tagItem !== tagToRemove;
                    });
                }
                
                return updatedState;
            });
            
            console.log("Tag berhasil dihapus:", tagToRemove);
        } catch (error) {
            console.error("Error removing tag:", error);
            alert("Gagal menghapus tag. Silakan coba lagi.");
        } finally {
            setIsTagLoading(false);
        }
    };
    
    // Handler ketika user menekan Enter, Tab, atau spasi di input tag
    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        // Support menambahkan tag dengan Enter atau Tab
        if ((e.key === 'Enter' || e.key === 'Tab') && tagInput.trim()) {
            e.preventDefault();
            addTag(tagInput);
            setShowSuggestions(false);
        }
        
        // Support menambahkan tag dengan spasi (jika tag berisi minimal 3 karakter)
        if (e.key === ' ' && tagInput.trim().length >= 3) {
            e.preventDefault();
            addTag(tagInput);
            setShowSuggestions(false);
        }
        
        // Tutup suggestion dropdown dengan escape
        if (e.key === 'Escape') {
            e.preventDefault();
            setShowSuggestions(false);
        }
    };

    // Safety timeout to prevent infinite loading state
    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined;
        if (isSaving) {
            // Reset loading state after 30 seconds if it's still saving
            timeoutId = setTimeout(() => {
                console.warn("Save operation timed out after 30 seconds");
                setIsSaving(false);
                alert("Operasi menyimpan memakan waktu terlalu lama. Silakan coba lagi.");
            }, 30000);
        }
        
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isSaving]);

    const handleChangeSituasi = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange((prev) => ({ ...prev, [name]: value }));
    };

    // Fungsi untuk mencari tag yang sudah ada di database
    const searchTags = async (query: string) => {
        if (!query || query.trim().length < 2) {
            setTagSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        
        setIsSearchingTags(true);
        setShowSuggestions(true);
        
        try {
            // Gunakan endpoint search tags
            const response = await axios.get(`/tindakan/tags/search?q=${encodeURIComponent(query.trim())}`);
            
            if (response.data && Array.isArray(response.data)) {
                // Filter out tags that are already selected
                const filteredSuggestions = response.data.filter(
                    (suggestion: string) => !tags.includes(suggestion)
                );
                setTagSuggestions(filteredSuggestions);
            }
        } catch (error) {
            console.error("Error searching for tags:", error);
            setTagSuggestions([]);
        } finally {
            setIsSearchingTags(false);
        }
    };
    
    // Debounce search untuk mencegah terlalu banyak API call
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (tagInput.trim()) {
                searchTags(tagInput);
            } else {
                setTagSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300); // 300ms delay
        
        return () => clearTimeout(delaySearch);
    }, [tagInput, tags]);
    
    // Tutup suggestion ketika klik di luar komponen
    useEffect(() => {
        const handleClickOutside = () => {
            setShowSuggestions(false);
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    return (
        <div className="space-y-4">
            {/* Form Tingkat Kedaruratan */}
            <div className="grid grid-cols-4 items-center gap-2">
                <div className="relative col-span-1">
                    <label className="font-medium text-gray-800">
                        Tingkat Kedaruratan
                    </label>
                </div>
                <div className="col-span-3">
                    <select
                        name="situasi"
                        value={data.situasi || ""}
                        onChange={handleChangeSituasi}
                        className="w-full border border-yellow-300 bg-yellow-50 text-gray-800 p-2 rounded-md placeholder:text-grey-700 focus:ring-yellow-400 focus:border-yellow-500"
                    >
                        <option value="">-- Pilih Opsi --</option>
                        <option value="Darurat">Darurat</option>
                        <option value="Permintaan Informasi">Permintaan Informasi</option>
                        <option value="Berpengawasan">Berpengawasan</option>
                        <option value="Tidak Berpengawasan">Tidak Berpengawasan</option>
                    </select>
                </div>
            </div>
            
            {/* Form Tag/Hashtag */}
            <div className="grid grid-cols-4 items-start gap-2">
                <div className="relative col-span-1">
                    <label className="font-medium text-gray-800">
                        Tag/Hashtag
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Tekan Enter untuk menambahkan tag</p>
                </div>
                <div className="col-span-3">
                    <div className="space-y-3">
                        {/* Input Tag */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Masukkan tag/hashtag... (contoh: penting, urgensi, dll)"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onClick={(e) => {
                                    // Prevent event propagation to avoid closing suggestions
                                    e.stopPropagation();
                                    if (tagInput.trim() && tagSuggestions.length > 0) {
                                        setShowSuggestions(true);
                                    }
                                }}
                                className={`w-full border p-2 rounded-md placeholder:text-gray-500 transition-colors 
                                    ${isTagLoading || isSearchingTags ? 'bg-gray-100 border-gray-300' : 'border-blue-300 bg-blue-50'} 
                                    ${(!data.tindakanId && !data._id) ? 'cursor-not-allowed' : ''}
                                    focus:ring-blue-400 focus:border-blue-500`}
                                disabled={isTagLoading || (!data.tindakanId && !data._id)}
                            />
                            {(isTagLoading || isSearchingTags) && (
                                <div className="absolute right-3 top-2">
                                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                </div>
                            )}
                            
                            {/* Tag Suggestions Dropdown */}
                            {showSuggestions && tagSuggestions.length > 0 && (
                                <div 
                                    className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {tagSuggestions.map((suggestion, index) => (
                                        <div 
                                            key={index}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 text-sm"
                                            onClick={() => {
                                                addTag(suggestion);
                                                setShowSuggestions(false);
                                                setTagInput("");
                                            }}
                                        >
                                            #{suggestion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {(!data.tindakanId && !data._id) && (
                            <p className="text-xs text-amber-600 mt-1">
                                Simpan formulir terlebih dahulu sebelum menambahkan tag
                            </p>
                        )}
                        
                        {/* Tags Display */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map((tag, index) => (
                                <div 
                                    key={index} 
                                    className={`flex items-center px-2 py-1 rounded-md text-sm
                                        ${isTagLoading ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}
                                >
                                    #{tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className={`ml-1 focus:outline-none transition-colors
                                            ${isTagLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                                        disabled={isTagLoading}
                                        title={isTagLoading ? "Sedang memproses..." : "Hapus tag"}
                                    >
                                        <RiCloseLine size={16} />
                                    </button>
                                </div>
                            ))}
                            
                            {tags.length === 0 && !isTagLoading && (data.tindakanId || data._id) && (
                                <p className="text-sm text-gray-500 italic">Belum ada tag yang ditambahkan</p>
                            )}
                            
                            {isTagLoading && (
                                <p className="text-sm text-blue-500 italic">Memperbarui tag...</p>
                            )}
                        </div>
                        
                        {/* Tag Suggestions */}
                        {showSuggestions && tagSuggestions.length > 0 && (
                            <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md w-full mt-1">
                                {tagSuggestions.map((suggestion, index) => (
                                    <div
                                        key={index}
                                        onClick={() => addTag(suggestion)}
                                        className="cursor-pointer p-2 hover:bg-blue-50 transition-colors flex items-center justify-between"
                                    >
                                        <span className="text-gray-800">#{suggestion}</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeTag(suggestion);
                                            }}
                                            className="text-red-500 hover:text-red-700 transition-colors"
                                            title="Hapus tag ini"
                                        >
                                            <RiCloseLine size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {showSuggestions && tagSuggestions.length === 0 && (
                            <div className="absolute z-10 bg-white border border-gray-300 rounded-md shadow-md w-full mt-1">
                                <div className="p-2 text-center text-gray-500">
                                    Tidak ada saran tag yang cocok
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-2 flex justify-center">
                <button
                    onClick={() => {
                        if (!saveData) {
                            console.error("saveData function is not available");
                            alert("Tidak dapat menyimpan perubahan: Fungsi penyimpanan tidak tersedia");
                            return;
                        }
                        setIsSaving(true);
                        
                        // Track start time to detect slow operations
                        const startTime = Date.now();
                        console.log("Starting form save operation at", new Date().toISOString());
                        
                        // Set a failsafe timeout to prevent permanent loading state
                        const timeoutId = setTimeout(() => {
                            console.warn("Form save operation timed out after 15 seconds");
                            setIsSaving(false);
                            alert("Operasi menyimpan memakan waktu terlalu lama. Silakan coba lagi.");
                        }, 15000);
                        
                        try {
                            saveData()
                                .then(() => {
                                    console.log("Form save succeeded in", Date.now() - startTime, "ms");
                                    setSaveMessage("Perubahan berhasil disimpan");
                                    setSaveSuccessModalVisible(true);
                                    setInitialData({...data});
                                    setHasFormChanges(false);
                                })                            
                                .catch((error: any) => {
                                    console.error("Error saving data:", error);
                                    alert(`Gagal menyimpan data: ${error?.message || "Terjadi kesalahan"}`);
                                })
                                .finally(() => {
                                    console.log("Form save operation completed in", Date.now() - startTime, "ms");
                                    setIsSaving(false);
                                    clearTimeout(timeoutId);
                                });
                        } catch (error: any) {
                            console.error("Unexpected error in save button handler:", error);
                            setIsSaving(false);
                            clearTimeout(timeoutId);
                            alert(`Terjadi kesalahan tak terduga saat menyimpan: ${error?.message || ""}`);
                        }
                    }}
                    disabled={isSaving || !hasFormChanges}
                    className={`px-4 py-2 rounded-md text-white text-sm flex items-center gap-2 transition ${
                        isSaving || !hasFormChanges ? "bg-gray-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"
                    }`}
                >
                    {isSaving ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg
                                className="animate-spin h-5 w-5 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                ></path>
                            </svg>
                            <span>Sedang menyimpan...</span>
                        </div>
                    ) : (
                        <>
                            <RiSave3Fill size={16} />
                            <span>{!hasFormChanges ? "Tidak Ada Perubahan" : "Simpan Perubahan"}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Modal Simpan Loading */}
            {isSaving && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                    <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4">
                        <svg className="animate-spin h-10 w-10 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <p className="text-gray-700 font-semibold">Sedang menyimpan...</p>
                    </div>
                </div>
            )}

            {/* Modal Simpan Berhasil */}
            {saveSuccessModalVisible && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]"
                    onClick={() => setSaveSuccessModalVisible(false)}
                >
                    <div
                        className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-green-100 p-2 rounded-full mb-2">
                            <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-gray-700 font-semibold text-center">{saveMessage}</p>
                        <button
                            onClick={() => setSaveSuccessModalVisible(false)}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
                        >
                            Oke
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
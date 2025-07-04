"use client";
import { useEffect, useState, KeyboardEvent } from "react";
import Image from "next/image";
import axios from "../../../utils/axiosInstance";
import dynamic from "next/dynamic";
import Zoom from "react-medium-image-zoom";
import { useSwipeable } from "react-swipeable";
import Profile from "./profile";
import dayjs from "dayjs";
import "dayjs/locale/id";
import PhotoDownloader, { usePhotoDownloader } from "../PhotoDownloader";
import { RiCloseLine } from "react-icons/ri";
import { Data } from "../../../lib/types";

const MapView = dynamic(() => import("./MapViews"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function Keluhan({ sessionId, data: propData }: { sessionId: string; data?: any }) {
    // Debug logging untuk props
    console.info("🔍 [Keluhan] Component rendered with props:", {
        sessionId,
        propData,
        propDataKeys: propData ? Object.keys(propData) : 'null',
        tindakan: propData?.tindakan,
        tindakanKeys: propData?.tindakan ? Object.keys(propData.tindakan) : 'null'
    });

    const [data, setData] = useState<Data | null>(propData || null);
    const [showModal, setShowModal] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    
    // Hook untuk download foto
    const { downloadPhoto, downloadMultiplePhotos } = usePhotoDownloader();

    // Editable states and edit mode toggles
    const [isEditingMessage, setIsEditingMessage] = useState(false);
    const [isEditingLocation, setIsEditingLocation] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    const [editedMessage, setEditedMessage] = useState("");
    const [editedLocation, setEditedLocation] = useState("");

    const [isSavingMessage, setIsSavingMessage] = useState(false);
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [saveMessageSuccess, setSaveMessageSuccess] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [saveLocationSuccess, setSaveLocationSuccess] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars

    const [saveError, setSaveError] = useState<string | null>(null);

    // State untuk menangani tag/hashtag dengan type safety
    const [tagInput, setTagInput] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [isTagLoading, setIsTagLoading] = useState(false);
    const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
    const [isSearchingTags, setIsSearchingTags] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Helper function to ensure tag is always a string
    const normalizeTag = (tag: any): string => {
        if (typeof tag === 'string') return tag;
        if (typeof tag === 'object' && tag !== null && 'hash_tag' in tag) return String(tag.hash_tag);
        return String(tag);
    };

    // Helper function to normalize tags array
    const normalizeTags = (tagsArray: any[]): string[] => {
        if (!Array.isArray(tagsArray)) return [];
        return tagsArray.map(normalizeTag).filter(tag => tag && tag.trim() !== '');
    };

    // Sync state jika propData berubah
    useEffect(() => {
        // Console log untuk debugging propData
        console.info("🔍 [Keluhan] PropData received:", propData);
        console.info("🔍 [Keluhan] PropData tindakan:", propData?.tindakan);
        console.info("🔍 [Keluhan] PropData tindakan._id:", propData?.tindakan?._id);
        console.info("🔍 [Keluhan] PropData tindakan.tag:", propData?.tindakan?.tag);
        
        if (propData) {
            setData(propData);
            setEditedMessage(propData.message || "");
            setEditedLocation(propData.location?.description || "");
            
            // Initialize tags dari propData.tindakan.tag dengan safety check
            if (propData.tindakan?.tag && Array.isArray(propData.tindakan.tag)) {
                const extractedTags = normalizeTags(propData.tindakan.tag);
                console.info("🔍 [Keluhan] Extracted tags:", extractedTags);
                setTags(extractedTags);
            } else {
                console.info("🔍 [Keluhan] No tags found or not in array format");
                setTags([]);
            }
        }
    }, [propData]);

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
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert("Teks berhasil disalin ke clipboard");
            }).catch(() => {
                // Fallback for older browsers or when clipboard API fails
                alert("Gagal menyalin ke clipboard");
            });
        } else {
            // Fallback when clipboard API is not available
            alert("Fitur copy tidak tersedia");
        }
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

    // Load existing tags when data changes - gunakan propData langsung
    useEffect(() => {
        console.info("🔍 [Keluhan] useEffect propData.tindakan.tag triggered:", propData?.tindakan?.tag);
        
        if (propData?.tindakan?.tag && Array.isArray(propData.tindakan.tag)) {
            // Extract tags dari propData.tindakan.tag dengan safety check
            const extractedTags = normalizeTags(propData.tindakan.tag);
            console.info("🔍 [Keluhan] Setting tags from useEffect:", extractedTags);
            setTags(extractedTags);
        } else {
            console.info("🔍 [Keluhan] Setting empty tags from useEffect");
            setTags([]);
        }
    }, [propData?.tindakan?.tag]);

    // Fungsi untuk menambahkan tag - gunakan tindakan._id dari propData
    const addTag = async (tag: string) => {
        if (!tag.trim()) return;
        
        const trimmedTag = tag.trim();
        if (tags.includes(trimmedTag)) return; // Hindari duplikat
        
        // Gunakan propData untuk mendapatkan tindakan._id
        console.info("🔍 [Keluhan] addTag - propData.tindakan:", propData?.tindakan);
        console.info("🔍 [Keluhan] addTag - tindakan._id:", propData?.tindakan?._id);
        
        if (!propData?.tindakan?._id) {
            console.error("❌ [Keluhan] Data atau Tindakan ID tidak tersedia dari propData, tidak dapat menambahkan tag");
            return;
        }
        
        try {
            setIsTagLoading(true);
            
            // Kirim tag ke API menggunakan endpoint tindakan dari propData
            console.info("🔍 [Keluhan] Sending POST to:", `${API_URL}/tindakan/${propData.tindakan._id}/tag`);
            const response = await axios.post(`${API_URL}/tindakan/${propData.tindakan._id}/tag`, {
                hash_tag: trimmedTag
            });
            
            console.info("✅ [Keluhan] Add tag response:", response.data);
            
            // Update state lokal - pastikan tag selalu string
            const newTags = [...tags, trimmedTag];
            setTags(newTags);
            setTagInput("");
            
            // Update data state
            setData(prev => {
                if (!prev || !prev.tindakan || !prev.tindakan._id) return prev;
                return {
                    ...prev,
                    tindakan: {
                        ...prev.tindakan,
                        _id: prev.tindakan._id, // ensure _id is always present
                        tag: [
                            ...(Array.isArray(prev.tindakan.tag) ? prev.tindakan.tag : []),
                            { hash_tag: trimmedTag, _id: response?.data?.tindakan._id || prev.tindakan._id }
                        ]
                    }
                };
            });
            
            console.log("✅ [Keluhan] Tag berhasil ditambahkan:", trimmedTag);
        } catch (error) {
            console.error("❌ [Keluhan] Error adding tag:", error);
            alert("Gagal menambahkan tag. Silakan coba lagi.");
        } finally {
            setIsTagLoading(false);
        }
    };
    
    // Fungsi untuk menghapus tag - gunakan tindakan._id dari propData
    const removeTag = async (tagToRemove: string) => {
        // Pastikan tagToRemove adalah string
        const tagString = normalizeTag(tagToRemove);
        
        // Gunakan propData untuk mendapatkan tindakan._id
        if (!propData?.tindakan?._id) {
            console.error("Tindakan ID tidak tersedia dari propData, tidak dapat menghapus tag");
            return;
        }
        
        try {
            setIsTagLoading(true);
            
            // Kirim permintaan hapus tag ke API menggunakan tindakan._id dari propData
            await axios.delete(`${API_URL}/tindakan/${propData.tindakan._id}/tag/${encodeURIComponent(tagString)}`);
            
            // Update state lokal - pastikan semua tag adalah string
            const newTags = tags.filter(tag => normalizeTag(tag) !== tagString);
            setTags(newTags);
            
            // Update data state
            setData(prev => {
                if (!prev || !prev.tindakan || !prev.tindakan._id) return prev;
                return {
                    ...prev,
                    tindakan: {
                        ...prev.tindakan,
                        _id: prev.tindakan._id, // ensure _id is always present
                        tag: Array.isArray(prev.tindakan.tag) ? prev.tindakan.tag.filter(tagItem => {
                            return normalizeTag(tagItem) !== tagString;
                        }) : []
                    }
                };
            });
            
            console.log("Tag berhasil dihapus:", tagString);
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
            // Gunakan endpoint search tags untuk tindakan
            const response = await axios.get(`${API_URL}/tindakan/tags/search?q=${encodeURIComponent(query.trim())}`);
            
            if (response.data && Array.isArray(response.data.tags)) {
                // Filter out tags that are already selected, ensure all comparisons are strings
                const filteredSuggestions = response.data.tags.filter(
                    (suggestion: string) => {
                        const suggestionString = normalizeTag(suggestion);
                        return !tags.some(tag => normalizeTag(tag) === suggestionString);
                    }
                );
                setTagSuggestions(filteredSuggestions);
            } else if (response.data && Array.isArray(response.data)) {
                // Fallback for direct array response
                const filteredSuggestions = response.data.filter(
                    (suggestion: string) => {
                        const suggestionString = normalizeTag(suggestion);
                        return !tags.some(tag => normalizeTag(tag) === suggestionString);
                    }
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

    useEffect(() => {
        if (saveError) {
            alert(saveError);
            setSaveError(null);
        }
    }, [saveError]);

    useEffect(() => {
        const handleEsc = (e: Event) => {
            const keyboardEvent = e as unknown as globalThis.KeyboardEvent;
            if (keyboardEvent.key === "Escape") setShowModal(false);
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
            label: "Tag/Hashtag",
            value: (
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
                                e.stopPropagation();
                                if (tagInput.trim() && tagSuggestions.length > 0) {
                                    setShowSuggestions(true);
                                }
                            }}
                            className={`w-full border p-2 rounded-md placeholder:text-gray-500 transition-colors 
                                ${isTagLoading || isSearchingTags ? 'bg-gray-100 border-gray-300' : 'border-blue-300 bg-blue-50'} 
                                ${!propData?.tindakan?._id ? 'cursor-not-allowed' : ''}
                                focus:ring-blue-400 focus:border-blue-500`}
                            disabled={isTagLoading || !propData?.tindakan?._id}
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
                    
                    {!propData?.tindakan?._id && (
                        <p className="text-xs text-amber-600 mt-1">
                            Tindakan ID tidak tersedia untuk menambahkan tag
                        </p>
                    )}
                    
                    {/* Tags Display */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map((tag, index) => {
                            // Ensure tag is always a string using helper function
                            const tagString = normalizeTag(tag);
                            return (
                                <div 
                                    key={index} 
                                    className={`flex items-center px-2 py-1 rounded-md text-sm
                                        ${isTagLoading ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}
                                >
                                    #{tagString}
                                    <button
                                        onClick={() => removeTag(tagString)}
                                        className={`ml-1 focus:outline-none transition-colors
                                            ${isTagLoading ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                                        disabled={isTagLoading}
                                        title={isTagLoading ? "Sedang memproses..." : "Hapus tag"}
                                    >
                                        <RiCloseLine size={16} />
                                    </button>
                                </div>
                            );
                        })}
                        
                        {tags.length === 0 && !isTagLoading && propData?.tindakan?._id && (
                            <p className="text-sm text-gray-500 italic">Belum ada tag yang ditambahkan</p>
                        )}
                        
                        {isTagLoading && (
                            <p className="text-sm text-blue-500 italic">Memperbarui tag...</p>
                        )}
                    </div>
                </div>
            ),
            action: (
                <div className="text-xs text-gray-500">
                    Tekan Enter untuk menambahkan
                </div>
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
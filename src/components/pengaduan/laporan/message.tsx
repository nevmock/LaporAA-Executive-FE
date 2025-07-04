import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import axios from "../../../utils/axiosInstance";
import { FaPaperPlane, FaImage, FaTimes, FaPlay, FaPause, FaDownload, FaFileAlt, FaMapMarkerAlt, FaVolumeUp, FaVideo, FaMusic, FaPaperclip, FaPlus, FaFolder } from "react-icons/fa";
import FileManager from "../../FileManager";
import { FileItem } from "../../../hooks/useFileManagement";
import { useSocketChat } from "../../../hooks/useSocket";
import ConnectionStatus from "../../socket/ConnectionStatus";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL || "http://localhost:3001";

interface MessageItem {
    _id?: string;
    sessionId: string;
    message: string;
    senderName: string;
    from: string;
    timestamp: string;
    type?: string;         // text | image | etc
    mediaUrl?: string;     // for image
}

// Props interface untuk manual mode control
interface MessageProps {
    from: string;
    mode: "bot" | "manual";
    onModeChange?: (newMode: "bot" | "manual") => void;
    forceMode?: boolean; // Receive force mode from parent
}

export default function Message({ from, mode, onModeChange, forceMode = false }: MessageProps) {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [modeChanging, setModeChanging] = useState(false);
    
    // Use global socket context instead of local socket
    const socket = useSocketChat(from);
    
    // Image upload states
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    
    // File upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [uploadMenuOpen, setUploadMenuOpen] = useState(false);
    
    // Media player states
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);
    const [loadingMedia, setLoadingMedia] = useState<Record<string, boolean>>({});
    
    // Advanced Message Features states
    const [messageQueue, setMessageQueue] = useState<any[]>([]);
    const [failedMessages, setFailedMessages] = useState<any[]>([]);
    const [sendingMessages, setSendingMessages] = useState<Record<string, boolean>>({});
    const [compressingImage, setCompressingImage] = useState(false);
    const [splittingMessage, setSplittingMessage] = useState(false);
    const [templatesOpen, setTemplatesOpen] = useState(false);
    
    // File Manager states
    const [fileManagerOpen, setFileManagerOpen] = useState(false);
    
    // Real-time Enhancement states
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sending' | 'delivered' | 'read' | 'failed'>>({});
    const [readReceipts, setReadReceipts] = useState<Record<string, boolean>>({});
    const [lastSeen, setLastSeen] = useState<Record<string, Date>>({});
    const [adminOnlineStatus, setAdminOnlineStatus] = useState<'online' | 'offline' | 'away'>('offline');
    
    // Typing timeout ref
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Message templates
    const messageTemplates = [
        "Terima kasih atas laporan Anda. Tim kami akan segera menindaklanjuti.",
        "Mohon maaf atas keterlambatan respons. Kami sedang memproses laporan Anda.",
        "Laporan Anda telah kami terima dan sedang dalam tahap verifikasi.",
        "Silakan kirim foto lokasi kejadian untuk membantu proses penanganan.",
        "Tim lapangan telah diberangkatkan ke lokasi yang Anda laporkan.",
        "Laporan Anda telah selesai ditangani. Terima kasih atas partisipasinya."
    ];

    const limit = 20;

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const videoInputRef = useRef<HTMLInputElement | null>(null);
    const audioInputRef = useRef<HTMLInputElement | null>(null);
    const documentInputRef = useRef<HTMLInputElement | null>(null);

    // Manual mode toggle function
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toggleMode = async () => {
        if (modeChanging || !onModeChange) return;
        
        setModeChanging(true);
        try {
            const newMode = mode === "bot" ? "manual" : "bot";
            
            if (newMode === "manual") {
                // Set manual mode dengan timeout 30 menit
                await axios.post(`${API_URL}/mode/manual/${from}`, { minutes: 30 });
            } else {
                // Set bot mode
                await axios.put(`${API_URL}/mode/${from}`, { mode: "bot" });
            }
            
            onModeChange(newMode);
            console.log(`Mode manually changed to ${newMode} for ${from}`);
        } catch (error) {
            console.error("Failed to change mode:", error);
            alert("Gagal mengubah mode. Silakan coba lagi.");
        } finally {
            setModeChanging(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setUnreadCount(0);
        }, 100);
    };

    function parseWhatsAppFormatting(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;") // biar aman dari XSS
            .replace(/>/g, "&gt;")
            .replace(/\*(.*?)\*/g, "<strong>$1</strong>") // *bold*
            .replace(/_(.*?)_/g, "<em>$1</em>")           // _italic_
            .replace(/~(.*?)~/g, "<s>$1</s>")             // ~strikethrough~
            .replace(/```/g, "")                          // fallback kalau tidak ditutup
            .replace(/`([^`]+)`/g, "<code>$1</code>");    // `inline code`
    }

    const fetchMessages = async (initial = false) => {
        try {
            const skip = initial ? 0 : messages.length;
            const res = await axios.get(`${API_URL}/chat/${from}?limit=${limit}&skip=${skip}`);
            const newMessages = res.data;

            if (initial) {
                setMessages(newMessages);
                scrollToBottom();
            } else {
                if (newMessages.length < limit) setHasMore(false);
                setMessages((prev) => [...newMessages, ...prev]);
            }
        } catch (err) {
            console.error("Gagal fetch pesan:", err);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (uploadMenuOpen) {
                const target = event.target as HTMLElement;
                if (!target.closest('.upload-menu-container')) {
                    setUploadMenuOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [uploadMenuOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (templatesOpen) {
                const target = event.target as HTMLElement;
                if (!target.closest('.templates-dropdown-container')) {
                    setTemplatesOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [templatesOpen]);

    // Set up socket event handlers with global socket context
    useEffect(() => {
        if (!socket.isConnected) {
            console.log("⏳ Waiting for socket connection...");
            return;
        }

        console.log("✅ Setting up socket event handlers for chat:", from);

        const handleNewMessage = (...args: unknown[]) => {
            const msg = args[0] as MessageItem;
            if (msg.from !== from) return;
            console.log("New message received:", msg);
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        };

        // Register event handlers
        socket.on("newMessage", handleNewMessage);

        // Real-time enhancement socket event handlers
        socket.on("userTyping", (...args: unknown[]) => {
            const data = args[0] as { userId: string, isTyping: boolean };
            if (data.userId !== from) return;
            setTypingUsers(prev => {
                if (data.isTyping) {
                    return prev.includes(data.userId) ? prev : [...prev, data.userId];
                } else {
                    return prev.filter(id => id !== data.userId);
                }
            });
        });

        socket.on("userOnline", (...args: unknown[]) => {
            const data = args[0] as { userId: string, status: 'online' | 'offline' | 'away' };
            if (data.userId !== from) return;
            setOnlineUsers(prev => {
                if (data.status === 'online') {
                    return prev.includes(data.userId) ? prev : [...prev, data.userId];
                } else {
                    return prev.filter(id => id !== data.userId);
                }
            });
            setLastSeen(prev => ({ ...prev, [data.userId]: new Date() }));
        });

        socket.on("messageStatus", (...args: unknown[]) => {
            const data = args[0] as { messageId: string, status: 'delivered' | 'read' | 'failed' };
            setMessageStatuses(prev => ({ ...prev, [data.messageId]: data.status }));
        });

        socket.on("messageRead", (...args: unknown[]) => {
            const data = args[0] as { messageId: string, userId: string };
            if (data.userId !== from) return;
            setReadReceipts(prev => ({ ...prev, [data.messageId]: true }));
        });

        socket.on("adminOnlineStatus", (...args: unknown[]) => {
            const data = args[0] as { status: 'online' | 'offline' | 'away' };
            setAdminOnlineStatus(data.status);
        });

        // Fetch initial messages
        fetchMessages(true);

        return () => {
            // Cleanup event listeners
            socket.off("newMessage", handleNewMessage);
            socket.off("userTyping");
            socket.off("userOnline");
            socket.off("messageStatus");
            socket.off("messageRead");
            socket.off("adminOnlineStatus");
            
            // Clean up typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [socket.isConnected, from]);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
        setIsScrolledUp(!atBottom);
        if (atBottom) setUnreadCount(0);

        if (scrollTop === 0 && hasMore && !loadingMore) {
            setLoadingMore(true);
            const container = chatContainerRef.current;
            const prevScrollHeight = container?.scrollHeight || 0;

            fetchMessages(false).finally(() => {
                setLoadingMore(false);
                setTimeout(() => {
                    const newScrollHeight = container?.scrollHeight || 0;
                    const diff = newScrollHeight - prevScrollHeight;
                    if (container) container.scrollTop = diff;
                }, 50);
            });
        }
    };

    const sendMessage = () => {
        if (!newMessage.trim() && !selectedImage && !selectedFile) return;
        
        if (selectedImage) {
            sendImageMessageEnhanced(selectedImage, newMessage);
        } else if (selectedFile) {
            sendFileMessageEnhanced(selectedFile, newMessage);
        } else {
            sendTextMessageEnhanced(newMessage);
            setNewMessage("");
        }
    };

    // Image upload functions
    const validateImageFile = (file: File): boolean => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!allowedTypes.includes(file.type)) {
            alert('Tipe file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.');
            return false;
        }
        
        if (file.size > maxSize) {
            alert('File terlalu besar. Maksimal 5MB.');
            return false;
        }
        
        return true;
    };

    const validateVideoFile = (file: File): boolean => {
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (!allowedTypes.includes(file.type)) {
            alert('Tipe video tidak didukung. Gunakan MP4, AVI, MOV, WMV, atau WebM.');
            return false;
        }
        
        if (file.size > maxSize) {
            alert('File video terlalu besar. Maksimal 50MB.');
            return false;
        }
        
        return true;
    };

    const validateAudioFile = (file: File): boolean => {
        const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'];
        const maxSize = 20 * 1024 * 1024; // 20MB
        
        if (!allowedTypes.includes(file.type)) {
            alert('Tipe audio tidak didukung. Gunakan MP3, WAV, OGG, M4A, atau AAC.');
            return false;
        }
        
        if (file.size > maxSize) {
            alert('File audio terlalu besar. Maksimal 20MB.');
            return false;
        }
        
        return true;
    };

    const validateDocumentFile = (file: File): boolean => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            alert('Tipe dokumen tidak didukung. Gunakan PDF, DOC, XLS, PPT, atau TXT.');
            return false;
        }
        
        if (file.size > maxSize) {
            alert('File dokumen terlalu besar. Maksimal 10MB.');
            return false;
        }
        
        return true;
    };

    // Real-time enhancement functions
    const handleTypingIndicator = (typing: boolean) => {
        if (!socket.isConnected) return;
        
        if (typing) {
            setIsTyping(true);
            socket.sendTyping(true);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Set new timeout to stop typing indicator
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                socket.sendTyping(false);
            }, 2000); // Stop typing indicator after 2 seconds of inactivity
        } else {
            setIsTyping(false);
            socket.sendTyping(false);
            
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }
    };

    const markMessageAsRead = (messageId: string) => {
        if (!socket.isConnected) return;
        socket.markMessageRead(messageId);
    };

    const updateMessageStatus = (messageId: string, status: 'sending' | 'delivered' | 'read' | 'failed') => {
        setMessageStatuses(prev => ({ ...prev, [messageId]: status }));
    };

    const formatLastSeen = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return "Baru saja";
        if (minutes < 60) return `${minutes} menit yang lalu`;
        if (hours < 24) return `${hours} jam yang lalu`;
        return `${days} hari yang lalu`;
    };

    const handleImageSelect = (file: File) => {
        if (!validateImageFile(file)) return;
        
        setSelectedImage(file);
        setSelectedFile(null);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setUploadMenuOpen(false);
    };

    const handleVideoSelect = (file: File) => {
        if (!validateVideoFile(file)) return;
        
        setSelectedFile(file);
        setSelectedImage(null);
        setImagePreview(null);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setUploadMenuOpen(false);
    };

    const handleAudioSelect = (file: File) => {
        if (!validateAudioFile(file)) return;
        
        setSelectedFile(file);
        setSelectedImage(null);
        setImagePreview(null);
        
        // Create preview for audio
        const reader = new FileReader();
        reader.onload = (e) => {
            setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        setUploadMenuOpen(false);
    };

    const handleDocumentSelect = (file: File) => {
        if (!validateDocumentFile(file)) return;
        
        setSelectedFile(file);
        setSelectedImage(null);
        setImagePreview(null);
        setFilePreview(null);
        setUploadMenuOpen(false);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageSelect(file);
        }
    };

    const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleVideoSelect(file);
        }
    };

    const handleAudioInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleAudioSelect(file);
        }
    };

    const handleDocumentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleDocumentSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        
        const file = e.dataTransfer.files?.[0];
        if (!file) return;
        
        if (file.type.startsWith('image/')) {
            handleImageSelect(file);
        } else if (file.type.startsWith('video/')) {
            handleVideoSelect(file);
        } else if (file.type.startsWith('audio/')) {
            handleAudioSelect(file);
        } else {
            handleDocumentSelect(file);
        }
    };

    const clearImageSelection = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Enhanced message sending with queue and retry
    const addToMessageQueue = (messageData: any) => {
        const messageId = Date.now().toString();
        const queueItem = { ...messageData, id: messageId, timestamp: new Date() };
        setMessageQueue(prev => [...prev, queueItem]);
        setSendingMessages(prev => ({ ...prev, [messageId]: true }));
        return messageId;
    };

    const removeFromMessageQueue = (messageId: string) => {
        setMessageQueue(prev => prev.filter(item => item.id !== messageId));
        setSendingMessages(prev => {
            const newState = { ...prev };
            delete newState[messageId];
            return newState;
        });
    };

    const addToFailedMessages = (messageData: any, error: string) => {
        setFailedMessages(prev => [...prev, { ...messageData, error, failedAt: new Date() }]);
    };

    const retryFailedMessage = async (failedMessage: any) => {
        setFailedMessages(prev => prev.filter(item => item.id !== failedMessage.id));
        
        if (failedMessage.type === 'image') {
            await sendImageMessageEnhanced(failedMessage.file, failedMessage.caption);
        } else if (failedMessage.type === 'file') {
            await sendFileMessageEnhanced(failedMessage.file, failedMessage.caption);
        } else {
            await sendTextMessageEnhanced(failedMessage.message);
        }
    };

    const sendTextMessageEnhanced = async (message: string) => {
        // Check if message needs splitting
        const MAX_LENGTH = 4096;
        if (message.length > MAX_LENGTH) {
            setSplittingMessage(true);
            const parts = [];
            for (let i = 0; i < message.length; i += MAX_LENGTH) {
                parts.push(message.slice(i, i + MAX_LENGTH));
            }
            
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const messageId = addToMessageQueue({
                    type: 'text',
                    message: part,
                    part: i + 1,
                    totalParts: parts.length
                });
                
                try {
                    await axios.post(`${API_URL}/chat/send/${from}`, {
                        message: part,
                        nama_admin: localStorage.getItem("nama_admin") || "Admin",
                        role: localStorage.getItem("role") || "Admin",
                    });
                    removeFromMessageQueue(messageId);
                    
                    // Delay between parts
                    if (i < parts.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 700));
                    }
                } catch (error) {
                    removeFromMessageQueue(messageId);
                    addToFailedMessages({
                        id: messageId,
                        type: 'text',
                        message: part,
                        part: i + 1,
                        totalParts: parts.length
                    }, 'Failed to send message part');
                }
            }
            setSplittingMessage(false);
        } else {
            const messageId = addToMessageQueue({ type: 'text', message });
            
            try {
                await axios.post(`${API_URL}/chat/send/${from}`, {
                    message,
                    nama_admin: localStorage.getItem("nama_admin") || "Admin",
                    role: localStorage.getItem("role") || "Admin",
                });
                removeFromMessageQueue(messageId);
            } catch (error) {
                removeFromMessageQueue(messageId);
                addToFailedMessages({ id: messageId, type: 'text', message }, 'Failed to send message');
            }
        }
    };

    const sendImageMessageEnhanced = async (imageFile: File, caption: string) => {
        const messageId = addToMessageQueue({ type: 'image', file: imageFile, caption });
        setIsUploading(true);
        setUploadProgress(0);
        
        // Check if image needs compression
        if (imageFile.size > 2 * 1024 * 1024) { // 2MB
            setCompressingImage(true);
        }
        
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('caption', caption);
            formData.append('nama_admin', localStorage.getItem("nama_admin") || "Admin");
            formData.append('role', localStorage.getItem("role") || "Admin");
            
            const response = await axios.post(
                `${API_URL}/chat/send/image/${from}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                        setUploadProgress(progress);
                    }
                }
            );
            
            if (response.data.success) {
                removeFromMessageQueue(messageId);
                setNewMessage("");
                setSelectedImage(null);
                setImagePreview(null);
                setUploadProgress(0);
            }
        } catch (error) {
            removeFromMessageQueue(messageId);
            addToFailedMessages({ id: messageId, type: 'image', file: imageFile, caption }, 'Failed to send image');
        } finally {
            setIsUploading(false);
            setCompressingImage(false);
        }
    };

    const sendFileMessageEnhanced = async (file: File, caption: string) => {
        const messageId = addToMessageQueue({ type: 'file', file, caption });
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
            const formData = new FormData();
            const nama_admin = localStorage.getItem("nama_admin") || "Admin";
            const role = localStorage.getItem("role") || "Admin";
            
            formData.append('caption', caption);
            formData.append('nama_admin', nama_admin);
            formData.append('role', role);
            
            let endpoint = "";
            let fieldName = "";
            
            if (file.type.startsWith('video/')) {
                endpoint = `${API_URL}/chat/send/video/${from}`;
                fieldName = 'video';
            } else if (file.type.startsWith('audio/')) {
                endpoint = `${API_URL}/chat/send/audio/${from}`;
                fieldName = 'audio';
            } else {
                endpoint = `${API_URL}/chat/send/document/${from}`;
                fieldName = 'document';
            }
            
            formData.append(fieldName, file);
            
            const response = await axios.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploadProgress(progress);
                }
            });
            
            if (response.data.success) {
                removeFromMessageQueue(messageId);
                setNewMessage("");
                setSelectedFile(null);
                setFilePreview(null);
                setUploadProgress(0);
            }
        } catch (error) {
            removeFromMessageQueue(messageId);
            addToFailedMessages({ id: messageId, type: 'file', file, caption }, 'Failed to send file');
        } finally {
            setIsUploading(false);
        }
    };

    const formatDate = (rawDate?: string): string => {
        if (!rawDate) return "-";
        const date = new Date(rawDate);
        if (isNaN(date.getTime())) return "-";

        const now = new Date();
        const isSameDay = date.toDateString() === now.toDateString();
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const time = date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
        });

        if (isSameDay) return `Hari ini, ${time}`;
        if (isYesterday) return `Kemarin, ${time}`;

        return `${date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Jakarta",
        })}, ${time}`;
    };

    // Manual reconnect is handled by global socket context
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleManualReconnect = () => {
        console.log("Manual reconnect - handled by global socket context");
        // The global socket context handles reconnection automatically
    };

    const [imageLoaded, setImageLoaded] = useState(false);

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    // Auto-resize textarea
    const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
        element.style.height = 'auto';
        element.style.height = Math.min(element.scrollHeight, 120) + 'px';
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        adjustTextareaHeight(e.target);
        
        // Handle typing indicator
        if (e.target.value.trim()) {
            handleTypingIndicator(true);
        } else {
            handleTypingIndicator(false);
        }
    };

    // Media handling functions
    const getFileExtension = (filename: string): string => {
        return filename.toLowerCase().split('.').pop() || '';
    };

    const getFileIcon = (filename: string): React.ReactNode => {
        const ext = getFileExtension(filename);
        switch (ext) {
            case 'pdf':
                return <FaFileAlt className="text-red-500 text-2xl" />;
            case 'doc':
            case 'docx':
                return <FaFileAlt className="text-blue-500 text-2xl" />;
            case 'xls':
            case 'xlsx':
                return <FaFileAlt className="text-green-500 text-2xl" />;
            case 'ppt':
            case 'pptx':
                return <FaFileAlt className="text-orange-500 text-2xl" />;
            default:
                return <FaFileAlt className="text-gray-500 text-2xl" />;
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleVideoPlay = (mediaUrl: string) => {
        setPlayingVideo(playingVideo === mediaUrl ? null : mediaUrl);
    };

    const handleAudioPlay = (mediaUrl: string) => {
        setPlayingAudio(playingAudio === mediaUrl ? null : mediaUrl);
    };

    const handleMediaLoad = (mediaUrl: string, isLoading: boolean) => {
        setLoadingMedia(prev => ({
            ...prev,
            [mediaUrl]: isLoading
        }));
    };

    const downloadFile = (mediaUrl: string, filename?: string) => {
        const link = document.createElement('a');
        link.href = `${API_URL}${mediaUrl}`;
        link.download = filename || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Media display components
    const renderVideoPlayer = (mediaUrl: string, caption?: string) => (
        <div className="relative mb-2">
            <video
                className="rounded-lg max-w-full max-h-64 object-cover"
                controls
                preload="metadata"
                onLoadStart={() => handleMediaLoad(mediaUrl, true)}
                onLoadedData={() => handleMediaLoad(mediaUrl, false)}
                onError={() => handleMediaLoad(mediaUrl, false)}
            >
                <source src={mediaUrl.startsWith('http') ? mediaUrl : `${API_URL}${mediaUrl}`} />
                Video tidak dapat dimuat
            </video>
            {loadingMedia[mediaUrl] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            {caption && <p className="text-xs mt-1 text-gray-600">{caption}</p>}
        </div>
    );

    const renderAudioPlayer = (mediaUrl: string, caption?: string) => (
        <div className="mb-2">
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                <div className="flex items-center gap-3">
                    <FaVolumeUp className="text-gray-600 text-lg" />
                    <div className="flex-1">
                        <audio
                            className="w-full"
                            controls
                            preload="metadata"
                            onLoadStart={() => handleMediaLoad(mediaUrl, true)}
                            onLoadedData={() => handleMediaLoad(mediaUrl, false)}
                            onError={() => handleMediaLoad(mediaUrl, false)}
                        >
                            <source src={mediaUrl.startsWith('http') ? mediaUrl : `${API_URL}${mediaUrl}`} />
                            Audio tidak dapat dimuat
                        </audio>
                    </div>
                </div>
                {loadingMedia[mediaUrl] && (
                    <div className="flex items-center justify-center py-2">
                        <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>
            {caption && <p className="text-xs mt-1 text-gray-600">{caption}</p>}
        </div>
    );

    const renderDocumentViewer = (mediaUrl: string, message: string) => {
        const filename = mediaUrl.split('/').pop() || 'document';
        const ext = getFileExtension(filename);
        const fullUrl = mediaUrl.startsWith('http') ? mediaUrl : `${API_URL}${mediaUrl}`;
        
        return (
            <div className="mb-2">
                <div 
                    className="bg-gray-100 rounded-lg p-3 max-w-xs cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => downloadFile(fullUrl, filename)}
                >
                    <div className="flex items-center gap-3">
                        {getFileIcon(filename)}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {filename}
                            </p>
                            <p className="text-xs text-gray-500 uppercase">
                                {ext} file
                            </p>
                        </div>
                        <FaDownload className="text-gray-500 text-sm" />
                    </div>
                </div>
                {message && message !== `[Document] ${filename}` && (
                    <p className="text-xs mt-1 text-gray-600">{message}</p>
                )}
            </div>
        );
    };

    const renderStickerDisplay = (mediaUrl: string) => (
        <div className="mb-2">
            <Image
                src={mediaUrl.startsWith('http') ? mediaUrl : `${API_URL}${mediaUrl}`}
                alt="Sticker"
                width={150}
                height={150}
                className="rounded-lg object-contain"
                onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/150?text=Sticker";
                }}
            />
        </div>
    );

    const renderLocationDisplay = (message: string) => {
        // Parse location from message if it contains coordinates
        const locationMatch = message.match(/Location.*?(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
        const lat = locationMatch ? parseFloat(locationMatch[1]) : null;
        const lng = locationMatch ? parseFloat(locationMatch[2]) : null;
        
        return (
            <div className="mb-2">
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-red-500 text-lg mt-1" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">
                                📍 Lokasi
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                {message.replace(/^\[Location\]\s*/, '')}
                            </p>
                            {lat && lng && (
                                <button
                                    onClick={() => window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank')}
                                    className="text-xs text-blue-500 hover:underline mt-1"
                                >
                                    Lihat di Google Maps
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderVoiceMessage = (mediaUrl: string) => (
        <div className="mb-2">
            <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                <div className="flex items-center gap-3">
                    <FaVolumeUp className="text-blue-500 text-lg" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">🎙️ Pesan Suara</p>
                        <audio
                            className="w-full mt-2"
                            controls
                            preload="metadata"
                        >
                            <source src={mediaUrl.startsWith('http') ? mediaUrl : `${API_URL}${mediaUrl}`} />
                            Audio tidak dapat dimuat
                        </audio>
                    </div>
                </div>
            </div>
        </div>
    );

    const insertTemplate = (template: string) => {
        setNewMessage(template);
        setTemplatesOpen(false);
        // Focus on textarea after inserting template
        setTimeout(() => {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(template.length, template.length);
            }
        }, 100);
    };

    // Handle file selection from File Manager
    const handleFileManagerSelect = (file: FileItem) => {
        setFileManagerOpen(false);
        setUploadMenuOpen(false);
        
        // Send file message directly using the existing file URL
        const messageData = {
            from: from,
            message: file.name,
            type: file.mimeType.startsWith('image/') ? 'image' : 
                  file.mimeType.startsWith('video/') ? 'video' :
                  file.mimeType.startsWith('audio/') ? 'audio' : 'document',
            mediaUrl: file.url,
            caption: file.name
        };
        
        // Send via API directly
        sendFileFromManager(messageData);
    };
    
    // Send file selected from File Manager
    const sendFileFromManager = async (messageData: any) => {
        if (mode === "bot") {
            alert("Mode saat ini dalam Bot Mode. Ubah ke Manual Mode untuk mengirim file.");
            return;
        }
        
        const tempId = Date.now().toString();
        
        try {
            // Add to sending queue
            setSendingMessages(prev => ({ ...prev, [tempId]: true }));
            
            // Send via API
            const response = await axios.post(`/chat/send/${from}`, messageData);
            
            if (response.data.success) {
                // Add to messages
                const newMessage = {
                    _id: response.data.messageId,
                    sessionId: from,
                    message: messageData.message,
                    senderName: "Admin",
                    from: from,
                    timestamp: new Date().toISOString(),
                    type: messageData.type,
                    mediaUrl: messageData.mediaUrl
                };
                
                setMessages(prev => [...prev, newMessage]);
                
                // Send via socket
                if (socket.isConnected) {
                    socket.sendMessage(newMessage.message, newMessage.type, newMessage.mediaUrl);
                }
            }
        } catch (error) {
            console.error('Error sending file from manager:', error);
            alert('Gagal mengirim file dari File Manager');
        } finally {
            setSendingMessages(prev => {
                const newState = { ...prev };
                delete newState[tempId];
                return newState;
            });
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Connection Status Indicator */}
            <div className="absolute top-4 right-4 z-10">
                <ConnectionStatus showText={true} showDetails={false} />
            </div>

            {/* Online Status & Admin Info */}
            <div className="absolute top-4 left-4 z-10">
                <div className="flex items-center gap-3">
                    {/* User Online Status */}
                    {onlineUsers.includes(from) && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>User Online</span>
                        </div>
                    )}
                    
                    {/* Admin Online Status */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                        adminOnlineStatus === 'online' ? 'bg-green-100 text-green-800' : 
                        adminOnlineStatus === 'away' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            adminOnlineStatus === 'online' ? 'bg-green-500' : 
                            adminOnlineStatus === 'away' ? 'bg-yellow-500' : 
                            'bg-gray-500'
                        }`}></div>
                        <span>Admin {adminOnlineStatus === 'online' ? 'Online' : adminOnlineStatus === 'away' ? 'Away' : 'Offline'}</span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#EFEAE2]"
                ref={chatContainerRef}
                onScroll={handleScroll}
            >
                {loadingMore && <p className="text-center text-xs text-gray-500">Memuat pesan lama...</p>}
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">Belum ada pesan.</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={msg._id || `${msg.sessionId}-${msg.senderName}-${index}`}
                            className={`flex ${msg.senderName === "Bot" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-xs md:max-w-sm p-3 rounded-lg ${msg.senderName === "Bot" ? "bg-[#128C7E] text-white" : "bg-white text-gray-800"}`}>
                                {msg.type === "image" && msg.mediaUrl ? (
                                    <>
                                        {!imageLoaded && <div className="w-full h-48 bg-gray-200 rounded-md mb-2"></div>}
                                        <Image
                                            src={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${API_URL}${msg.mediaUrl}`}
                                            alt="Gambar"
                                            width={300}
                                            height={200}
                                            className={`rounded mb-2 max-w-full ${imageLoaded ? "" : "opacity-0"}`}
                                            onLoad={handleImageLoad}
                                            onError={(e) => {
                                                e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
                                            }}
                                        />
                                        {msg.message && msg.message !== "[Gambar]" && (
                                            <div
                                                className="whitespace-pre-wrap text-sm"
                                                dangerouslySetInnerHTML={{ __html: parseWhatsAppFormatting(msg.message) }}
                                            />
                                        )}
                                    </>
                                ) : msg.type === "video" && msg.mediaUrl ? (
                                    <>
                                        {renderVideoPlayer(msg.mediaUrl, msg.message)}
                                    </>
                                ) : msg.type === "audio" && msg.mediaUrl ? (
                                    <>
                                        {renderAudioPlayer(msg.mediaUrl, msg.message)}
                                    </>
                                ) : msg.type === "voice" && msg.mediaUrl ? (
                                    <>
                                        {renderVoiceMessage(msg.mediaUrl)}
                                    </>
                                ) : msg.type === "document" && msg.mediaUrl ? (
                                    <>
                                        {renderDocumentViewer(msg.mediaUrl, msg.message)}
                                    </>
                                ) : msg.type === "sticker" && msg.mediaUrl ? (
                                    <>
                                        {renderStickerDisplay(msg.mediaUrl)}
                                    </>
                                ) : msg.type === "location" ? (
                                    <>
                                        {renderLocationDisplay(msg.message)}
                                    </>
                                ) : (
                                    <div
                                        className="whitespace-pre-wrap text-sm"
                                        dangerouslySetInnerHTML={{ __html: parseWhatsAppFormatting(msg.message) }}
                                    />
                                )}
                                <div className="flex items-center justify-between mt-1">
                                    <p className={`text-xs ${msg.senderName === "Bot" ? "text-gray-300" : "text-gray-400"}`}>
                                        {formatDate(msg.timestamp)}
                                    </p>
                                    
                                    {/* Message Status Indicators (only for admin messages) */}
                                    {msg.senderName === "Bot" && msg._id && (
                                        <div className="flex items-center space-x-1">
                                            {messageStatuses[msg._id] === 'sending' && (
                                                <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            {messageStatuses[msg._id] === 'delivered' && (
                                                <div className="text-gray-300">✓</div>
                                            )}
                                            {messageStatuses[msg._id] === 'read' && (
                                                <div className="text-blue-300">✓✓</div>
                                            )}
                                            {messageStatuses[msg._id] === 'failed' && (
                                                <div className="text-red-300">⚠</div>
                                            )}
                                            {readReceipts[msg._id] && (
                                                <div className="text-blue-300 text-xs">Dibaca</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} className="pb-20" />
            </div>

            {/* Scroll to Bottom */}
            {unreadCount > 0 && (
                <div
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-[#128C7E] text-white px-4 py-2 rounded-full cursor-pointer z-10"
                    onClick={scrollToBottom}
                >
                    {unreadCount} Pesan Baru
                </div>
            )}

            {/* Input */}
            {mode === "manual" && (
                <div className="bg-white border-t">
                    {/* File Preview */}
                    {(imagePreview || filePreview || selectedFile) && (
                        <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    {imagePreview ? (
                                        <Image
                                            src={imagePreview}
                                            alt="Preview"
                                            width={100}
                                            height={100}
                                            className="rounded-lg object-cover"
                                        />
                                    ) : filePreview && selectedFile?.type.startsWith('video/') ? (
                                        <video
                                            src={filePreview}
                                            width={100}
                                            height={100}
                                            className="rounded-lg object-cover"
                                            controls
                                        />
                                    ) : selectedFile?.type.startsWith('audio/') ? (
                                        <div className="w-24 h-24 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <FaMusic className="text-blue-500" size={32} />
                                        </div>
                                    ) : selectedFile ? (
                                        <div className="w-24 h-24 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <FaFileAlt className="text-purple-500" size={32} />
                                        </div>
                                    ) : null}
                                    
                                    <button
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setSelectedFile(null);
                                            setImagePreview(null);
                                            setFilePreview(null);
                                            setUploadProgress(0);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                                        disabled={isUploading}
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-600 mb-1">
                                        {selectedImage?.name || selectedFile?.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {selectedImage && (selectedImage.size / 1024 / 1024).toFixed(2)} MB
                                        {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                    {selectedFile?.type.startsWith('audio/') && filePreview && (
                                        <audio
                                            src={filePreview}
                                            controls
                                            className="mt-2 w-full max-w-xs"
                                        />
                                    )}
                                    {isUploading && (
                                        <div className="mt-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Uploading {uploadProgress}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="text-xs text-gray-500">User sedang mengetik...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Drag & Drop Area */}
                    <div 
                        className={`relative ${dragActive ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {dragActive && (
                            <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 z-10">
                                <div className="text-center">
                                    <FaImage className="mx-auto text-blue-500 text-2xl mb-2" />
                                    <p className="text-blue-600 font-medium">Drop gambar di sini</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Input Area */}
                        <div className="p-4 flex items-end gap-3">
                            {/* Upload Menu Button */}
                            <div className="relative upload-menu-container">
                                <button
                                    onClick={() => setUploadMenuOpen(!uploadMenuOpen)}
                                    className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-full transition-colors"
                                    disabled={isUploading}
                                    title="Upload Media"
                                >
                                    <FaPlus size={20} />
                                </button>
                                
                                {/* Upload Menu Dropdown */}
                                {uploadMenuOpen && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                                        <div className="p-2">
                                            <button
                                                onClick={() => imageInputRef.current?.click()}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            >
                                                <FaImage className="text-green-500" size={16} />
                                                <span className="text-sm">Foto</span>
                                            </button>
                                            <button
                                                onClick={() => videoInputRef.current?.click()}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            >
                                                <FaVideo className="text-red-500" size={16} />
                                                <span className="text-sm">Video</span>
                                            </button>
                                            <button
                                                onClick={() => audioInputRef.current?.click()}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            >
                                                <FaMusic className="text-blue-500" size={16} />
                                                <span className="text-sm">Audio</span>
                                            </button>
                                            <button
                                                onClick={() => documentInputRef.current?.click()}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            >
                                                <FaFileAlt className="text-purple-500" size={16} />
                                                <span className="text-sm">Dokumen</span>
                                            </button>
                                            <hr className="my-2 border-gray-200" />
                                            <button
                                                onClick={() => setFileManagerOpen(true)}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                            >
                                                <FaFolder className="text-yellow-500" size={16} />
                                                <span className="text-sm">File Manager</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Hidden File Inputs */}
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleImageInputChange}
                                className="hidden"
                            />
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                onChange={handleVideoInputChange}
                                className="hidden"
                            />
                            <input
                                ref={audioInputRef}
                                type="file"
                                accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac"
                                onChange={handleAudioInputChange}
                                className="hidden"
                            />
                            <input
                                ref={documentInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                onChange={handleDocumentInputChange}
                                className="hidden"
                            />
                            
                            {/* Message Templates Button */}
                            <div className="relative templates-dropdown-container">
                                <button
                                    onClick={() => setTemplatesOpen(!templatesOpen)}
                                    className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-600 p-3 rounded-full transition-colors"
                                    disabled={isUploading}
                                    title="Message Templates"
                                >
                                    <FaFileAlt size={20} />
                                </button>
                                
                                {/* Templates Dropdown */}
                                {templatesOpen && (
                                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[350px] max-h-64 overflow-y-auto">
                                        <div className="p-2">
                                            <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b">
                                                📝 Template Pesan
                                            </div>
                                            {messageTemplates.map((template, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => insertTemplate(template)}
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                                                >
                                                    {template}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Text Input */}
                            <textarea
                                className="flex-grow max-w-none p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 resize-none overflow-hidden"
                                value={newMessage}
                                onChange={handleTextareaChange}
                                placeholder={selectedImage || selectedFile ? "Tulis caption (opsional)..." : "Ketik pesan..."}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                rows={1}
                                style={{ minHeight: '48px' }}
                            />
                            
                            {/* Send Button */}
                            <button
                                onClick={sendMessage}
                                disabled={isUploading || (!newMessage.trim() && !selectedImage && !selectedFile)}
                                className={`flex-shrink-0 p-3 rounded-full transition-colors ${
                                    isUploading || (!newMessage.trim() && !selectedImage && !selectedFile)
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-[#128C7E] text-white hover:bg-[#0F7A6F]'
                                }`}
                            >
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <FaPaperPlane size={20} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Message Features Status */}
            {(splittingMessage || compressingImage || messageQueue.length > 0 || failedMessages.length > 0) && (
                <div className="bg-blue-50 border-b border-blue-200 p-3">
                    {splittingMessage && (
                        <div className="flex items-center gap-2 text-blue-700 text-sm mb-2">
                            <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                            <span>📝 Membagi pesan panjang...</span>
                        </div>
                    )}
                    
                    {compressingImage && (
                        <div className="flex items-center gap-2 text-blue-700 text-sm mb-2">
                            <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                            <span>🖼️ Mengompres gambar...</span>
                        </div>
                    )}
                    
                    {messageQueue.length > 0 && (
                        <div className="flex items-center gap-2 text-blue-700 text-sm mb-2">
                            <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                            <span>📤 Mengirim {messageQueue.length} pesan...</span>
                        </div>
                    )}
                    
                    {failedMessages.length > 0 && (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                                <span className="text-red-700 text-sm font-medium">
                                    ❌ {failedMessages.length} pesan gagal dikirim
                                </span>
                                <button
                                    onClick={() => {
                                        failedMessages.forEach(msg => retryFailedMessage(msg));
                                    }}
                                    className="text-red-700 hover:text-red-900 text-sm font-medium underline"
                                >
                                    Retry Semua
                                </button>
                            </div>
                            <div className="mt-1 space-y-1">
                                {failedMessages.map((msg, index) => (
                                    <div key={index} className="flex items-center justify-between text-xs text-red-600">
                                        <span>
                                            {msg.type === 'text' ? 
                                                `"${msg.message?.substring(0, 30)}..."` : 
                                                `${msg.type} - ${msg.file?.name || 'file'}`
                                            }
                                        </span>
                                        <button
                                            onClick={() => retryFailedMessage(msg)}
                                            className="hover:text-red-800 underline"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* File Manager Modal */}
            {fileManagerOpen && (
                <FileManager
                    onClose={() => setFileManagerOpen(false)}
                    onFileSelect={handleFileManagerSelect}
                    selectMode={true}
                    userId={from}
                    chatSession={from}
                />
            )}

            {/* Messages */}
        </div>
    );
}
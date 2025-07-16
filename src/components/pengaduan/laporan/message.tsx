import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import axios from "../../../utils/axiosInstance";
import { FaPaperPlane, FaImage, FaTimes, FaDownload, FaFileAlt, FaMapMarkerAlt, FaVolumeUp, FaVideo, FaMusic, FaPlus, FaFolder, FaSearchPlus, FaSearchMinus, FaExpand, FaCompress } from "react-icons/fa";
import FileManager from "../../FileManager";
import Portal from "../../Portal";
import dynamic from "next/dynamic";
import { FileItem } from "../../../hooks/useFileManagement";
import { useSocketChat } from "../../../hooks/useSocket";
import { MessageData, QueuedMessage, FailedMessage } from "../../../lib/types";

// Dynamic import untuk MapPopup
const MapPopup = dynamic(() => import("../mapPopup"), { ssr: false });

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
    id?: string;           // for message queue tracking
    file?: File;           // for failed message retry
    caption?: string;      // for media captions
    error?: string;        // for failed messages
    failedAt?: Date;       // for failed message timestamp
}

// Props interface untuk manual mode control
interface MessageProps {
    from: string;
    mode: "bot" | "manual";
    onModeChange?: (newMode: "bot" | "manual") => void;
    forceMode?: boolean; // Receive force mode from parent
}

export default function Message({ 
    from, 
    mode, 
    onModeChange: _, // eslint-disable-line @typescript-eslint/no-unused-vars
    forceMode = false // eslint-disable-line @typescript-eslint/no-unused-vars
}: MessageProps) {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
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
    const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
    const [failedMessages, setFailedMessages] = useState<FailedMessage[]>([]);
    const [compressingImage, setCompressingImage] = useState(false);
    const [splittingMessage, setSplittingMessage] = useState(false);
    const [templatesOpen, setTemplatesOpen] = useState(false);
    
    // File Manager states
    const [fileManagerOpen, setFileManagerOpen] = useState(false);
    
    // Preview Modal states
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [previewType, setPreviewType] = useState<"image" | "video" | "audio" | "document">("image");
    const [previewName, setPreviewName] = useState<string>("");
    const [zoomLevel, setZoomLevel] = useState(1);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Real-time Enhancement states
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [, setOnlineUsers] = useState<string[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sending' | 'delivered' | 'read' | 'failed'>>({});
    const [readReceipts, setReadReceipts] = useState<Record<string, boolean>>({});
    const [, setAdminOnlineStatus] = useState<'online' | 'offline' | 'away'>('offline'); // eslint-disable-line @typescript-eslint/no-unused-vars
    
    // Location popup states
    const [locationPopup, setLocationPopup] = useState<{
        isOpen: boolean;
        lat: number;
        lng: number;
        locationText: string;
    }>({
        isOpen: false,
        lat: 0,
        lng: 0,
        locationText: ''
    });
    
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
        console.log("🔌 Socket connected:", socket.isConnected);
        console.log("🏠 Auto-joining room: chat_" + from);

        const handleNewMessage = (...args: unknown[]) => {
            const msg = args[0] as MessageItem;
            
            // Only process messages for this chat session
            if (msg.from !== from) return;
            
            console.log("📨 New message received for chat:", from, msg);
            
            // Prevent duplicate messages
            setMessages(prev => {
                // Check if message already exists (by timestamp and content)
                const isDuplicate = prev.some(existingMsg => 
                    existingMsg.message === msg.message &&
                    existingMsg.senderName === msg.senderName &&
                    Math.abs(new Date(existingMsg.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 5000 // Within 5 seconds
                );
                
                if (isDuplicate) {
                    console.log("🔄 Duplicate message detected, skipping:", msg.message);
                    return prev;
                }
                
                return [...prev, msg];
            });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket.isConnected, from]);

    // Keyboard event handlers for preview modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!previewOpen) return;
            
            switch (e.key) {
                case 'Escape':
                    closePreview();
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    setZoomLevel(prev => Math.min(prev * 1.2, 5));
                    break;
                case '-':
                    e.preventDefault();
                    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
                    break;
                case '0':
                    e.preventDefault();
                    setZoomLevel(1);
                    setDragPosition({ x: 0, y: 0 });
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    setIsFullscreen(prev => !prev);
                    break;
                case 'd':
                case 'D':
                    e.preventDefault();
                    handleDownload();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [previewOpen]); // Only depend on previewOpen - other values are accessed via closure

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
        const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/x-ms-wmv', 'video/x-flv', 'video/3gpp'];
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (!allowedTypes.includes(file.type)) {
            alert('Tipe video tidak didukung. Gunakan MP4, AVI, MOV, WMV, WebM, MKV, FLV, atau 3GP.');
            return false;
        }
        
        if (file.size > maxSize) {
            alert('File video terlalu besar. Maksimal 50MB.');
            return false;
        }
        
        return true;
    };

    const validateAudioFile = (file: File): boolean => {
        const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mpeg', 'audio/wave', 'audio/x-wav', 'audio/mp4', 'audio/x-aac', 'audio/flac', 'audio/x-flac', 'audio/opus', 'audio/x-ms-wma'];
        const maxSize = 20 * 1024 * 1024; // 20MB
        
        if (!allowedTypes.includes(file.type)) {
            alert('Tipe audio tidak didukung. Gunakan MP3, WAV, OGG, M4A, AAC, FLAC, OPUS, atau WMA.');
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
            'text/plain',
            'text/rtf',
            'application/rtf',
            'application/vnd.oasis.opendocument.text',
            'application/vnd.oasis.opendocument.spreadsheet', 
            'application/vnd.oasis.opendocument.presentation'
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            alert('Tipe dokumen tidak didukung. Gunakan PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, ODT, ODS, atau ODP.');
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
            socket.sendTyping(true);
            
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Set new timeout to stop typing indicator
            typingTimeoutRef.current = setTimeout(() => {
                socket.sendTyping(false);
            }, 2000); // Stop typing indicator after 2 seconds of inactivity
        } else {
            socket.sendTyping(false);
            
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const markMessageAsRead = (messageId: string) => {
        if (!socket.isConnected) return;
        socket.markMessageRead(messageId);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateMessageStatus = (messageId: string, status: 'sending' | 'delivered' | 'read' | 'failed') => {
        setMessageStatuses(prev => ({ ...prev, [messageId]: status }));
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const clearImageSelection = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Enhanced message sending with queue and retry
    const addToMessageQueue = (messageData: MessageData) => {
        const messageId = Date.now().toString();
        const queueItem: QueuedMessage = { ...messageData, id: messageId, timestamp: new Date() };
        setMessageQueue(prev => [...prev, queueItem]);
        return messageId;
    };

    const removeFromMessageQueue = (messageId: string) => {
        setMessageQueue(prev => prev.filter(item => item.id !== messageId));
    };

    const addToFailedMessages = (messageData: MessageData, error: string) => {
        const failedMessage: FailedMessage = { ...messageData, id: Date.now().toString(), error, failedAt: new Date() };
        setFailedMessages(prev => [...prev, failedMessage]);
    };

    const retryFailedMessage = async (failedMessage: FailedMessage) => {
        setFailedMessages(prev => prev.filter(item => item.id !== failedMessage.id));
        
        if (failedMessage.type === 'image' && failedMessage.file) {
            await sendImageMessageEnhanced(failedMessage.file, failedMessage.caption);
        } else if (failedMessage.type === 'file' && failedMessage.file) {
            await sendFileMessageEnhanced(failedMessage.file, failedMessage.caption);
        } else if (failedMessage.message) {
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
                } catch {
                    removeFromMessageQueue(messageId);
                    addToFailedMessages({
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
            } catch {
                removeFromMessageQueue(messageId);
                addToFailedMessages({ type: 'text', message }, 'Failed to send message');
            }
        }
    };

    const sendImageMessageEnhanced = async (imageFile: File, caption?: string) => {
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
            if (caption) {
                formData.append('caption', caption);
            }
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
        } catch {
            removeFromMessageQueue(messageId);
            addToFailedMessages({ type: 'image', file: imageFile, caption }, 'Failed to send image');
        } finally {
            setIsUploading(false);
            setCompressingImage(false);
        }
    };

    const sendFileMessageEnhanced = async (file: File, caption?: string) => {
        const messageId = addToMessageQueue({ type: 'file', file, caption });
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
            const formData = new FormData();
            const nama_admin = localStorage.getItem("nama_admin") || "Admin";
            const role = localStorage.getItem("role") || "Admin";
            
            if (caption) {
                formData.append('caption', caption);
            }
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
        } catch {
            removeFromMessageQueue(messageId);
            addToFailedMessages({ type: 'file', file, caption }, 'Failed to send file');
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Preview Modal functions
    const openPreview = (url: string, type: "image" | "video" | "audio" | "document", name: string) => {
        const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
        setPreviewUrl(fullUrl);
        setPreviewType(type);
        setPreviewName(name);
        setPreviewOpen(true);
        setZoomLevel(1);
        setDragPosition({ x: 0, y: 0 });
        setIsFullscreen(false);
    };

    const closePreview = () => {
        setPreviewOpen(false);
        setPreviewUrl("");
        setPreviewName("");
        setZoomLevel(1);
        setDragPosition({ x: 0, y: 0 });
        setIsDragging(false);
        setIsFullscreen(false);
    };

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev * 1.2, 5));
    };

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
    };

    const handleResetZoom = () => {
        setZoomLevel(1);
        setDragPosition({ x: 0, y: 0 });
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleDownload = async () => {
        if (previewUrl) {
            // Extract the media URL path and use download route
            let mediaUrl = previewUrl;
            if (previewUrl.startsWith(`${API_URL}/`)) {
                mediaUrl = previewUrl.replace(API_URL, '');
            }
            
            const downloadUrl = `${API_URL}/download${mediaUrl}`;
            
            try {
                console.log('🔽 Starting download for:', previewName);
                
                // Use the download route that forces download
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = previewName || 'download';
                link.setAttribute('download', previewName || 'download');
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                console.log('✅ Download initiated:', previewName);
            } catch (error) {
                console.error('❌ Download failed:', error);
                
                // Fallback to blob method
                try {
                    const response = await fetch(previewUrl);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = previewName || 'download';
                    link.setAttribute('download', previewName || 'download');
                    link.style.display = 'none';
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    window.URL.revokeObjectURL(blobUrl);
                    
                    console.log('✅ Download completed:', previewName);
                } catch (fallbackError) {
                    console.error('❌ Fallback download also failed:', fallbackError);
                    alert('Download failed. Please try again.');
                }
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - dragPosition.x, y: e.clientY - dragPosition.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 1) {
            setDragPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (previewType === "image") {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoomLevel(prev => Math.min(Math.max(prev * delta, 0.1), 5));
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleVideoPlay = (mediaUrl: string) => {
        setPlayingVideo(playingVideo === mediaUrl ? null : mediaUrl);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleAudioPlay = (mediaUrl: string) => {
        setPlayingAudio(playingAudio === mediaUrl ? null : mediaUrl);
    };

    const handleMediaLoad = (mediaUrl: string, isLoading: boolean) => {
        setLoadingMedia(prev => ({
            ...prev,
            [mediaUrl]: isLoading
        }));
    };

    const downloadFile = async (mediaUrl: string, filename?: string) => {
        // Use the special download route that forces download
        const downloadUrl = `${API_URL}/download${mediaUrl}`;
        
        try {
            console.log('🔽 Starting download for:', filename);
            
            // Try the download route first (which sets proper headers)
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename || 'download';
            link.setAttribute('download', filename || 'download');
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('✅ Download initiated:', filename);
        } catch (error) {
            console.error('❌ Download failed:', error);
            
            // Fallback to blob method
            try {
                const response = await fetch(`${API_URL}${mediaUrl}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename || 'download';
                link.setAttribute('download', filename || 'download');
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.URL.revokeObjectURL(blobUrl);
            } catch (fallbackError) {
                console.error('❌ Fallback download also failed:', fallbackError);
                alert('Download failed. Please try again.');
            }
        }
    };

    // Media display components
    const renderVideoPlayer = (mediaUrl: string, caption?: string) => (
        <div className="relative mb-2 group cursor-pointer" onClick={() => openPreview(mediaUrl, "video", `Video-${Date.now()}`)}>
            <video
                className="rounded-lg max-w-full max-h-64 object-cover pointer-events-none"
                controls={false}
                preload="metadata"
                onLoadStart={() => handleMediaLoad(mediaUrl, true)}
                onLoadedData={() => handleMediaLoad(mediaUrl, false)}
                onError={() => handleMediaLoad(mediaUrl, false)}
                onClick={(e) => e.stopPropagation()}
            >
                <source src={mediaUrl.startsWith('http') ? mediaUrl : `${API_URL}${mediaUrl}`} />
                Video tidak dapat dimuat
            </video>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <FaSearchPlus className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
            </div>
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
                {/* File container */}
                <div 
                    className="bg-blue-100 rounded-lg p-3 cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => openPreview(fullUrl, "document", filename)}
                >
                    <div className="flex items-center gap-3">
                        {getFileIcon(filename)}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                                {filename}
                            </p>
                            <p className="text-xs text-gray-500 uppercase">
                                {ext} FILE - CLICK TO PREVIEW
                            </p>
                        </div>
                        <FaSearchPlus className="text-blue-500 text-sm" />
                    </div>
                </div>
                {message && message !== `[Document] ${filename}` && (
                    <p className="text-xs mt-1 text-gray-600">{message}</p>
                )}
            </div>
        );
    };

    const renderStickerDisplay = (mediaUrl: string) => (
        <div className="mb-2 group cursor-pointer" onClick={() => openPreview(mediaUrl, "image", `Sticker-${Date.now()}`)}>
            <div className="relative">
                <Image
                    src={mediaUrl.startsWith('http') ? mediaUrl : `${API_URL}${mediaUrl}`}
                    alt="Sticker"
                    width={150}
                    height={150}
                    className="rounded-lg object-contain transition-transform hover:scale-105"
                    onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/150?text=Sticker";
                    }}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <FaSearchPlus className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
                </div>
            </div>
        </div>
    );

    const renderLocationDisplay = (message: string) => {
        // Parse location from message - support multiple formats
        let lat: number | null = null;
        let lng: number | null = null;
        let locationText = message.replace(/^\[Location\]\s*/, '');
        
        // Try different location patterns
        const patterns = [
            /Location.*?(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // "Location: lat, lng"
            /(-?\d+\.\d+),\s*(-?\d+\.\d+)/, // "lat, lng"
            /lat:\s*(-?\d+\.\d+).*?lng:\s*(-?\d+\.\d+)/i, // "lat: x lng: y"
            /latitude:\s*(-?\d+\.\d+).*?longitude:\s*(-?\d+\.\d+)/i, // "latitude: x longitude: y"
        ];
        
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
                break;
            }
        }
        
        // Function to show location popup instead of directly opening Google Maps
        const showLocationPopup = () => {
            setLocationPopup({
                isOpen: true,
                lat: lat || 0,
                lng: lng || 0,
                locationText: locationText
            });
        };
        
        return (
            <div className="mb-2">
                <div 
                    className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3 max-w-xs cursor-pointer hover:shadow-md transition-all duration-200 hover:from-red-100 hover:to-orange-100"
                    onClick={showLocationPopup}
                    title="Klik untuk melihat lokasi"
                >
                    <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-red-500 text-lg mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                                📍 Lokasi
                                <span className="text-xs text-blue-600 font-normal">(klik untuk lihat)</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1 break-words">
                                {locationText}
                            </p>
                            {lat && lng && (
                                <p className="text-xs text-gray-500 mt-1 font-mono">
                                    {lat.toFixed(6)}, {lng.toFixed(6)}
                                </p>
                            )}
                            <div className="flex items-center gap-1 mt-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-blue-600 font-medium">Tap to view location</span>
                            </div>
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

    // Handle file selection from File Manager - only for preview
    const handleFileManagerSelect = (file: FileItem) => {
        setFileManagerOpen(false);
        setUploadMenuOpen(false);
        
        // Set preview based on file type - just for display, no editing
        if (file.mimeType.startsWith('image/')) {
            // Create a File object for image preview
            const imageFile = new File([], file.name, { type: file.mimeType });
            setSelectedImage(imageFile);
            setSelectedFile(null);
            setImagePreview(file.url ? (file.url.startsWith('http') ? file.url : `${API_URL}${file.url}`) : null);
            setFilePreview(null);
        } else {
            // For other file types, create a File object and set file preview
            const selectedFileObj = new File([], file.name, { type: file.mimeType });
            setSelectedFile(selectedFileObj);
            setSelectedImage(null);
            setImagePreview(null);
            
            if (file.mimeType.startsWith('video/') || file.mimeType.startsWith('audio/')) {
                setFilePreview(file.url ? (file.url.startsWith('http') ? file.url : `${API_URL}${file.url}`) : null);
            } else {
                setFilePreview(null);
            }
        }
        
        // Don't change the message input - keep it as is for user to type their own caption
    };

    return (
        <div className="flex flex-col h-full relative">

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
                            className={`flex ${msg.senderName === "Bot" || msg.senderName === "Admin" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-xs md:max-w-sm p-3 rounded-lg ${msg.senderName === "Bot" || msg.senderName === "Admin" ? "bg-[#128C7E] text-white" : "bg-white text-gray-800"}`}>
                                {msg.type === "image" && msg.mediaUrl ? (
                                    <>
                                        {!imageLoaded && <div className="w-full h-48 bg-gray-200 rounded-md mb-2"></div>}
                                        <div className="relative group cursor-pointer" onClick={() => openPreview(msg.mediaUrl!, "image", `Image-${formatDate(msg.timestamp)}`)}>
                                            <Image
                                                src={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${API_URL}${msg.mediaUrl}`}
                                                alt="Gambar"
                                                width={300}
                                                height={200}
                                                className={`rounded mb-2 max-w-full transition-transform hover:scale-105 ${imageLoaded ? "" : "opacity-0"}`}
                                                onLoad={handleImageLoad}
                                                onError={(e) => {
                                                    e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image";
                                                }}
                                            />
                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded mb-2 flex items-center justify-center">
                                                <FaSearchPlus className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" size={24} />
                                            </div>
                                        </div>
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
                                    <p className={`text-xs ${msg.senderName === "Bot" || msg.senderName === "Admin" ? "text-gray-300" : "text-gray-400"}`}>
                                        {formatDate(msg.timestamp)}
                                    </p>
                                    
                                    {/* Message Status Indicators (only for admin messages) */}
                                    {(msg.senderName === "Bot" || msg.senderName === "Admin") && msg._id && (
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
                />
            )}

            {/* Preview Modal */}
            {previewOpen && (
                <Portal>
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[1000000]"
                        style={{ pointerEvents: 'auto' }}
                        onClick={closePreview}
                    >
                        {/* Top Controls */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[1000001]" style={{ pointerEvents: 'auto' }}>
                            <div className="text-white font-medium truncate max-w-md">
                                {previewName}
                            </div>
                            <div className="flex items-center gap-2">
                                {previewType === "image" && (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                                            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
                                            title="Zoom Out (-)"
                                        >
                                            <FaSearchMinus size={16} />
                                        </button>
                                        <span className="text-white text-sm min-w-[60px] text-center">
                                            {Math.round(zoomLevel * 100)}%
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                                            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
                                            title="Zoom In (+)"
                                        >
                                            <FaSearchPlus size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
                                            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white px-3 py-2 rounded-full transition-colors text-sm"
                                            title="Reset Zoom (0)"
                                        >
                                            Reset
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
                                    title="Toggle Fullscreen (F)"
                                >
                                    {isFullscreen ? <FaCompress size={16} /> : <FaExpand size={16} />}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
                                    title="Download (D)"
                                >
                                    <FaDownload size={16} />
                                </button>
                                <button
                                    onClick={closePreview}
                                    className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-colors"
                                    title="Close (Esc)"
                                >
                                    <FaTimes size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div 
                            className={`relative ${isFullscreen ? 'w-full h-full' : 'max-w-7xl max-h-[90vh] w-full mx-4'} flex items-center justify-center`}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            style={{ cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default') }}
                        >
                            {previewType === "image" ? (
                                <Image
                                    src={previewUrl}
                                    alt={previewName}
                                    width={1200}
                                    height={800}
                                    className="max-w-full max-h-full object-contain"
                                    style={{
                                        transform: `scale(${zoomLevel}) translate(${dragPosition.x / zoomLevel}px, ${dragPosition.y / zoomLevel}px)`,
                                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                                    }}
                                    onError={(e) => {
                                        e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Not+Found";
                                    }}
                                />
                            ) : previewType === "video" ? (
                                <video
                                    src={previewUrl}
                                    controls
                                    className={`${isFullscreen ? 'w-full h-full' : 'max-w-full max-h-full'} object-contain`}
                                    autoPlay={false}
                                />
                            ) : previewType === "audio" ? (
                                <div className="bg-white p-8 rounded-lg">
                                    <div className="text-center mb-4">
                                        <FaVolumeUp size={48} className="mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-800">{previewName}</h3>
                                    </div>
                                    <audio
                                        src={previewUrl}
                                        controls
                                        className="w-full"
                                        autoPlay={false}
                                    />
                                </div>
                            ) : previewType === "document" ? (
                                <div className="w-full h-full flex flex-col">
                                    {previewName?.toLowerCase().endsWith('.pdf') ? (
                                        // PDF Preview using iframe
                                        <div className="flex-1 bg-white rounded-lg overflow-hidden">
                                            <iframe 
                                                src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                                className="w-full h-full min-h-[70vh]"
                                                title={previewName}
                                                onError={() => {
                                                    console.log("PDF iframe failed, trying object embed");
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        // Other documents - show download option
                                        <div className="bg-white p-8 rounded-lg max-w-md mx-auto">
                                            <div className="text-center">
                                                <FaFileAlt size={48} className="mx-auto text-gray-400 mb-4" />
                                                <h3 className="text-lg font-medium text-gray-800 mb-2">{previewName}</h3>
                                                <p className="text-gray-600 mb-4">This document type requires download to view</p>
                                                <button
                                                    onClick={handleDownload}
                                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    <FaDownload className="inline mr-2" />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* Bottom Instructions */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center text-sm opacity-75">
                            <div className="bg-black bg-opacity-50 px-4 py-2 rounded-lg">
                                {previewType === "image" && "Use +/- to zoom, 0 to reset, F for fullscreen, D to download, Esc to close"}
                                {previewType === "video" && "F for fullscreen, D to download, Esc to close"}
                                {previewType === "audio" && "D to download, Esc to close"}
                                {previewType === "document" && (previewName?.toLowerCase().endsWith('.pdf') ? "Mouse wheel to zoom, D to download, Esc to close" : "D to download, Esc to close")}
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Location Popup Modal */}
            {locationPopup.isOpen && (
                <Portal>
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="text-lg font-medium text-gray-900">
                                    📍 Detail Lokasi
                                </h3>
                                <button
                                    onClick={() => setLocationPopup({ isOpen: false, lat: 0, lng: 0, locationText: '' })}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimes size={20} />
                                </button>
                            </div>
                            
                            <div className="p-4">
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">Alamat:</p>
                                    <p className="font-medium text-gray-800">{locationPopup.locationText}</p>
                                </div>
                                
                                {locationPopup.lat !== 0 && locationPopup.lng !== 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 mb-2">Koordinat:</p>
                                        <p className="font-mono text-sm text-gray-700">
                                            {locationPopup.lat.toFixed(6)}, {locationPopup.lng.toFixed(6)}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="h-96 border rounded-lg overflow-hidden">
                                    <MapPopup 
                                        lat={locationPopup.lat || -6.200000}
                                        lon={locationPopup.lng || 106.816666}
                                        description={locationPopup.locationText || "Lokasi Tidak Diketahui"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Portal>
            )}

            {/* Messages */}
        </div>
    );
}
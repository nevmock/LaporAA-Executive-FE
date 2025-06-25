import { useEffect, useState, useRef } from "react";
import axios from "../../../utils/axiosInstance";
import { io, Socket } from "socket.io-client";
import { FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";

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
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [modeChanging, setModeChanging] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const limit = 20;

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    // Manual mode toggle function
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
        if (!from || !API_URL) {
            console.warn("Missing required data:", { from, API_URL });
            return;
        }
        
        console.log("Initializing socket with API_URL:", API_URL);
        
        // Initialize socket connection
        const socketInstance = io(`${API_URL}`, {
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 20000,
        });

        setSocket(socketInstance);

        // Socket event handlers
        socketInstance.on("connect", () => {
            console.log("Socket connected:", socketInstance.id);
            setIsConnected(true);
        });

        socketInstance.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
            setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
            console.error("Socket connection error:", error);
            setIsConnected(false);
        });

        socketInstance.on("reconnect", (attemptNumber) => {
            console.log("Socket reconnected after", attemptNumber, "attempts");
            setIsConnected(true);
        });

        socketInstance.on("reconnect_attempt", (attemptNumber) => {
            console.log("Socket reconnect attempt", attemptNumber);
        });

        socketInstance.on("reconnect_error", (error) => {
            console.error("Socket reconnect error:", error);
        });

        socketInstance.on("reconnect_failed", () => {
            console.error("Socket reconnection failed after maximum attempts");
            setIsConnected(false);
        });

        const handleNewMessage = (msg: MessageItem) => {
            if (msg.from !== from) return;
            console.log("New message received:", msg);
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        };

        socketInstance.on("newMessage", handleNewMessage);

        // Fetch initial messages
        fetchMessages(true);

        return () => {
            socketInstance.off("newMessage", handleNewMessage);
            socketInstance.off("connect");
            socketInstance.off("disconnect");
            socketInstance.off("connect_error");
            socketInstance.off("reconnect");
            socketInstance.off("reconnect_attempt");
            socketInstance.off("reconnect_error");
            socketInstance.off("reconnect_failed");
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [from]);

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
        if (!newMessage.trim()) return;
        const nama_admin = localStorage.getItem("nama_admin") || "Admin";
        const role = localStorage.getItem("role") || "Admin";
        axios.post(
            `${API_URL}/chat/send/${from}`,
            {
                message: newMessage,
                nama_admin,
                role
            }
        )
            .then(() => setNewMessage(""))
            .catch(err => console.error(err));
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

    const handleManualReconnect = () => {
        if (socket) {
            console.log("Manual reconnect triggered");
            socket.disconnect();
            socket.connect();
        }
    };

    const [imageLoaded, setImageLoaded] = useState(false);

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Connection Status Indicator */}
            {/* <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isConnected 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                    {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
                {!isConnected && (
                    <button
                        onClick={handleManualReconnect}
                        className="px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded text-xs hover:bg-blue-200"
                        title="Reconnect"
                    >
                        🔄
                    </button>
                )}
            </div> */}

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
                                        {!imageLoaded && <div className="skeleton-loader w-full h-48 bg-gray-200 rounded-md mb-2"></div>} {/* Skeleton Loader */}
                                        <img
                                            src={`${API_URL}${msg.mediaUrl}`}
                                            alt="Gambar"
                                            className={`rounded mb-2 max-w-full ${imageLoaded ? "" : "opacity-0"}`}
                                            onLoad={handleImageLoad}
                                            onError={(e) => {
                                                e.currentTarget.src = "https://via.placeholder.com/150?text=No+Image"; // Default placeholder
                                            }}
                                        />
                                    </>
                                ) : (
                                    <div
                                        className="whitespace-pre-wrap text-sm"
                                        dangerouslySetInnerHTML={{ __html: parseWhatsAppFormatting(msg.message) }}
                                    />
                                )}
                                <p className={`text-xs mt-1 ${msg.senderName === "Bot" ? "text-gray-300" : "text-gray-400"}`}>{formatDate(msg.timestamp)}</p>
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
                <div className="p-4 bg-white flex items-center border-t">
                    <input
                        type="text"
                        className="flex-grow max-w-[90%] p-3 border rounded-full focus:outline-none text-gray-800"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ketik pesan..."
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        className="ml-3 bg-[#128C7E] text-white p-3 rounded-full flex-shrink-0"
                    >
                        <FaPaperPlane size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
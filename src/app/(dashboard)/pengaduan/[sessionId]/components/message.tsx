"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaPaperPlane } from "react-icons/fa";
import { Switch } from "@headlessui/react";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;
const socket = io(`${API_URL}`, { autoConnect: false });

interface MessageItem {
    _id?: string;
    sessionId: string;
    message: string;
    senderName: string;
    from: string;
    timestamp: string;
}

export default function Message({ from }: { from: string }) {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [isScrolledUp, setIsScrolledUp] = useState(false);
    const [mode, setMode] = useState<"bot" | "manual">("bot");
    const [loadingMode, setLoadingMode] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const limit = 20;

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

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
        if (!from) return;

        axios
            .patch(`${API_URL}/user/user-mode/${from}`, { mode: "bot" })
            .then((res) => setMode(res.data.session.mode))
            .catch((err) => console.error("Gagal set mode awal:", err));

        fetchMessages(true);

        socket.connect();
        socket.on("newMessage", () => fetchMessages(true));

        return () => {
            socket.off("newMessage", () => fetchMessages(true));
            socket.disconnect();
        };
    }, [from]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            setUnreadCount(0);
        }, 100);
    };

    const handleScroll = () => {
        if (chatContainerRef.current) {
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
            
                    // Hitung perbedaan tinggi setelah load pesan baru
                    setTimeout(() => {
                        const newScrollHeight = container?.scrollHeight || 0;
                        const diff = newScrollHeight - prevScrollHeight;
                        if (container) {
                            container.scrollTop = diff; // Jaga posisi agar tidak loncat
                        }
                    }, 50); // Delay agar render selesai
                });
            }
            
        }
    };

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        axios
            .post(`${API_URL}/chat/send/${from}`, { message: newMessage })
            .then(() => setNewMessage(""))
            .catch((err) => console.error(err));
    };

    const toggleMode = async () => {
        const newMode = mode === "bot" ? "manual" : "bot";
        setLoadingMode(true);
        try {
            const res = await axios.patch(`${API_URL}/user/user-mode/${from}`, { mode: newMode });
            setMode(res.data.session.mode);
        } catch (err) {
            console.error("Gagal mengubah mode:", err);
            alert("❌ Gagal mengubah mode.");
        } finally {
            setLoadingMode(false);
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

    return (
        <div className="flex flex-col h-full relative">
            <div className="absolute top-2 right-4 z-20 flex items-center gap-2 bg-white shadow px-3 py-1 rounded-full border text-xs">
                <span className="text-gray-700">Mode:</span>
                <Switch
                    checked={mode === "manual"}
                    onChange={toggleMode}
                    className={`${mode === "manual" ? "bg-green-500" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition`}
                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${mode === "manual" ? "translate-x-6" : "translate-x-1"}`}
                    />
                </Switch>
                <span className="text-gray-700">{mode === "manual" ? "Manual" : "Bot"}</span>
            </div>

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
                            <div
                                className={`max-w-xs md:max-w-sm p-3 rounded-lg text-white ${msg.senderName === "Bot" ? "bg-[#128C7E]" : "bg-[#25D366]"}`}
                            >
                                <p>{msg.message}</p>
                                <p className="text-xs text-gray-200 mt-1">{formatDate(msg.timestamp)}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} className="pb-20" />
            </div>

            {unreadCount > 0 && (
                <div
                    className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-[#128C7E] text-white px-4 py-2 rounded-full cursor-pointer z-10"
                    onClick={scrollToBottom}
                >
                    {unreadCount} Pesan Baru
                </div>
            )}

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
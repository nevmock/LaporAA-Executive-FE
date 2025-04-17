"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaPaperPlane } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;
const socket = io(`${API_URL}`);

interface MessageItem {
    _id: string;
    sessionId: string;
    message: string;
    senderName: string;
    from: string;
    timestamp: string;
}

export default function Message({ from }: { from: string }) { // Ganti sessionId menjadi from
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [isScrolledUp, setIsScrolledUp] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (from) { // Gunakan from sebagai identifikasi
            axios.get(`${API_URL}/chat/${from}`) // Ganti sessionId dengan from
                .then((res) => setMessages(res.data))
                .catch((err) => console.error(err));
        }

        const handleNewMessage = (msg: MessageItem) => {
            if (msg.from === from) { // Periksa apakah pesan baru berasal dari from yang sama
                setMessages((prev) => [...prev, msg]);
                if (isScrolledUp) setUnreadCount((prev) => prev + 1);
                else scrollToBottom();
            }
        };

        socket.on("newMessage", handleNewMessage);
        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [from, isScrolledUp]);

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
        }
    };

    const sendMessage = () => {
        if (!newMessage.trim()) return;
        axios.post(`${API_URL}/chat/send/${from}`, { message: newMessage }) // Ganti sessionId dengan from
            .then(() => {
                setNewMessage("");
                scrollToBottom();
            })
            .catch((err) => console.error(err));
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

        const formattedDate = date.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "Asia/Jakarta",
        });

        return `${formattedDate}, ${time}`;
    };

    return (
        <div className="flex flex-col h-full">
            <div
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#EFEAE2]"
                ref={chatContainerRef}
                onScroll={handleScroll}
            >
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">Belum ada pesan.</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.senderName === "Bot" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-xs md:max-w-sm p-3 rounded-lg text-white ${msg.senderName === "Bot" ? "bg-[#128C7E]" : "bg-[#25D366]"
                                    }`}
                            >
                                <p>{msg.message}</p>
                                <p className="text-xs text-gray-200 mt-1">
                                    {formatDate(msg.timestamp)}
                                </p>
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

            <div className="p-4 bg-white flex items-center border-t">
                <input
                    type="text"
                    className="flex-grow max-w-[90%] p-3 border rounded-full focus:outline-none text-gray-800"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <button onClick={sendMessage} className="ml-3 bg-[#128C7E] text-white p-3 rounded-full flex-shrink-0">
                    <FaPaperPlane size={20} />
                </button>
            </div>
        </div>
    );
}
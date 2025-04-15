"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { io } from "socket.io-client";
import { FaPaperPlane } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;
const socket = io(`${API_URL}`);

interface Message {
    message: string;
    senderName: string;
    from: string;
}

interface ParamsType {
    from: string;
}


export default function ChatPage() {
    const params = useParams() as Record<string, string>;
    const from = params.from;


    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);
    const [isScrolledUp, setIsScrolledUp] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const chatContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (from) {
            axios
                .get<Message[]>(`${API_URL}/chat/${from}`)
                .then((res) => setMessages(res.data))
                .catch((err) => console.error(err));
        }

        const handleNewMessage = (msg: Message) => {
            console.log("📩 Pesan baru diterima dari WebSocket:", msg);
            if (msg.from === from) {
                setMessages((prevMessages) => [...prevMessages, msg]);

                if (isScrolledUp) {
                    setUnreadCount((prev) => prev + 1);
                } else {
                    scrollToBottom();
                }
            }
        };

        socket.on("newMessage", handleNewMessage);
        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [from, isScrolledUp]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            setUnreadCount(0);
        }, 100);
    };

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
            setIsScrolledUp(!atBottom);
            if (atBottom) {
                setUnreadCount(0);
            }
        }
    };

    const sendMessage = () => {
        if (!newMessage.trim()) return;

        axios
            .post(`${API_URL}/chat/send/${from}`, { message: newMessage })
            .then(() => {
                setNewMessage("");
                scrollToBottom();
            })
            .catch((err) => console.error(err));
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    return (
        <div className="w-full h-screen flex flex-col bg-[#EFEAE2]">
            <div className="p-4 bg-[#075E54] text-white font-bold flex items-center shadow-md">
                <div className="ml-2">Chat dengan {from}</div>
            </div>

            <div
                className="flex-1 overflow-y-auto p-4 space-y-3 relative"
                ref={chatContainerRef}
                onScroll={handleScroll}
            >
                {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">Belum ada pesan.</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.senderName === "Admin" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-xs md:max-w-sm p-3 rounded-lg text-white ${msg.senderName === "Admin" ? "bg-[#128C7E]" : "bg-[#25D366]"
                                    }`}
                            >
                                <p>{msg.message}</p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} className="pb-20" />
            </div>

            {unreadCount > 0 && (
                <div
                    className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-[#128C7E] text-white px-4 py-2 rounded-full cursor-pointer z-10"
                    onClick={scrollToBottom}
                >
                    {unreadCount} Pesan Baru
                </div>
            )}

            <div className="p-4 bg-white flex items-center border-t fixed bottom-0 w-full">
                <input
                    type="text"
                    className="flex-grow max-w-[90%] p-3 border rounded-full focus:outline-none text-gray-800"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    onKeyDown={handleKeyPress}
                />
                <button onClick={sendMessage} className="ml-3 bg-[#128C7E] text-white p-3 rounded-full flex-shrink-0">
                    <FaPaperPlane size={20} />
                </button>
            </div>
        </div>
    );
}

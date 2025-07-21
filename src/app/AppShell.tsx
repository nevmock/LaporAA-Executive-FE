"use client";

import Sidebar from "../components/sidebar";
import TopNavbar from "../components/TopNavbar";
import GlobalNotificationSystem from "../components/socket/GlobalNotificationSystem";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";

const API_URL = process.env.NEXT_PUBLIC_BE_BASE_URL;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const [countPending, setCountPending] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [namaAdmin, setNamaAdmin] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const [role, setRole] = useState<string | null>(null);

    // Get page title based on pathname
    const getPageTitle = () => {
        if (!pathname) return 'Laporan AA';
        
        if (pathname === '/dashboard') {
            return 'Dashboard';
        } else if (pathname.includes('/dashboard/buat-laporan')) {
            return 'Buat Laporan';
        } else if (pathname.includes('/pengaduan')) {
            return 'Daftar Pengaduan';
        }
        return 'Laporan AA';
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        } else {
            const username = localStorage.getItem("username");
            const role = localStorage.getItem("role");
            const namaAdminLocal = localStorage.getItem("nama_admin");
            setUserName(username || "Pengguna");
            setRole(role);
            setNamaAdmin(namaAdminLocal);
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        axios
            .get(`${API_URL}/reportCount`)
            .then((res) => {
                const data = res.data?.count ?? 0;
                setCountPending(data);
            })
            .catch(() => {
                setCountPending(0);
            });
    }, []);

    // Real-time update untuk count pending
    useEffect(() => {
        // Setup Socket.IO connection untuk real-time updates
        const setupSocketIO = async () => {
            try {
                const { io } = await import('socket.io-client');
                const socketUrl = process.env.NEXT_PUBLIC_BE_BASE_URL || 'http://localhost:3001';
                const socketIO = io(socketUrl, {
                    transports: ['polling', 'websocket'],
                    upgrade: true,
                    rememberUpgrade: true,
                    timeout: 20000,
                    forceNew: true
                });

                socketIO.on('connect', () => {
                    console.log('✅ Connected to real-time updates');
                    
                    // Authenticate and join admin room
                    const token = localStorage.getItem("token");
                    const userId = localStorage.getItem("username");
                    const userRole = localStorage.getItem("role");
                    
                    if (token && userId && userRole) {
                        socketIO.emit('authenticate', {
                            token,
                            userId,
                            role: userRole
                        });
                    }
                    
                    // Fallback manual join untuk admin room
                    socketIO.emit('join', 'admins');
                });

                // Listen untuk update count pending
                socketIO.on('pendingCountUpdate', (newCount) => {
                    console.log('📊 Pending count updated:', newCount);
                    setCountPending(newCount);
                });

                // Listen untuk new report notifications
                socketIO.on('newReportCreated', (data) => {
                    console.log('📋 New report created:', data);
                    // Refresh count ketika ada laporan baru
                    axios.get(`${API_URL}/reportCount`)
                        .then((res) => {
                            const count = res.data?.count ?? 0;
                            setCountPending(count);
                        })
                        .catch(() => {
                            // Ignore error pada background update
                        });
                });

                // Listen untuk status changes
                socketIO.on('tindakanStatusUpdated', (data) => {
                    console.log('🔄 Status updated:', data);
                    // Auto refresh count when status changes
                    axios.get(`${API_URL}/reportCount`)
                        .then((res) => {
                            const count = res.data?.count ?? 0;
                            setCountPending(count);
                        })
                        .catch(() => {
                            // Ignore error
                        });
                });

                socketIO.on('connect_error', (error) => {
                    console.warn('❌ Socket connection error:', error);
                });

                socketIO.on('disconnect', (reason) => {
                    console.log('🔌 Socket disconnected:', reason);
                });

                return () => {
                    socketIO.disconnect();
                };
            } catch (error) {
                console.warn('⚠️ Socket.IO not available, using polling fallback:', error);
                // Fallback: polling setiap 30 detik
                const interval = setInterval(() => {
                    axios.get(`${API_URL}/reportCount`)
                        .then((res) => {
                            const count = res.data?.count ?? 0;
                            setCountPending(count);
                        })
                        .catch(() => {
                            // Ignore error pada background polling
                        });
                }, 30000); // 30 seconds

                return () => clearInterval(interval);
            }
        };

        const cleanup = setupSocketIO();
        return () => {
            if (cleanup) cleanup.then(fn => fn && fn());
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1080);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex h-screen w-screen flex-col sm:flex-row">
            {/* Global Notification System */}
            <GlobalNotificationSystem />
            
            {isMobile ? (
                <>
                    <div className="flex flex-col h-screen overflow-hidden">
                        {/* Combined TopNavbar with SidebarHorizontal for Mobile */}
                        <TopNavbar 
                            title={getPageTitle()}
                            userName={userName || "Pengguna"}
                            role={role}
                            onLogout={handleLogout}
                            isMobile={true}
                            namaAdmin={namaAdmin || undefined}
                        />

                        {/* CONTENT */}
                        <div className="flex-1 overflow-auto bg-white">
                            {children}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <Sidebar countPending={countPending} role={role} />
                    <main className="flex-1 bg-gray-900 text-white flex flex-col overflow-hidden">
                        {/* TOP NAVBAR */}
                        <TopNavbar 
                            title={getPageTitle()}
                            userName={userName || "Pengguna"}
                            role={role}
                            onLogout={handleLogout}
                            isMobile={false}
                            namaAdmin={namaAdmin || undefined}
                        />

                        {/* CONTENT */}
                        <div className="flex-1 overflow-auto bg-white">
                            {children}
                        </div>
                    </main>
                </>
            )}
        </div>
    );
}

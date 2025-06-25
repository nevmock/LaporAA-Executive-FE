'use client';

import "../../globals.css";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Eye } from "lucide-react"; // Gunakan satu icon saja (tidak toggle)

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_BE_BASE_URL}/auth/login`, {
                username,
                password,
            });
            
            localStorage.setItem('user_id', res.data._id);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('username', res.data.username);
            localStorage.setItem('nama_admin', res.data.nama_admin);

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login gagal');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
            <div className="relative">
                {/* Logo Section - Positioned outside and overlapping the container */}
                <div className="flex justify-center items-center mb-4 relative z-10">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden border-4 border-white">
                        <img 
                            src="/LAPOR AA BUPATI.png" 
                            alt="LAPOR AA BUPATI" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
                
                {/* Main Container - positioned to overlap with logo */}
                <div className="relative bg-white p-6 sm:p-8 md:p-10 lg:p-12 pt-8 sm:pt-10 md:pt-12 lg:pt-14 -mt-12 sm:-mt-14 md:-mt-16 lg:-mt-18 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
                <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-6">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                        Dashboard Lapor AA
                    </h1>
                    <p className="text-xs sm:text-xs text-gray-300 mb-2">
                        version. public beta 2.0 - 250625
                    </p>
                    <p className="text-sm sm:text-base text-gray-600">
                        Silahkan masukkan details account anda
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 sm:py-4 border text-gray-800 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors text-sm sm:text-base"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Masukkan username"
                        />
                    </div>

                    <div>
                        <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-3 sm:py-4 border text-gray-800 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 pr-12 transition-colors text-sm sm:text-base"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                aria-label="Tahan untuk melihat password"
                                onMouseDown={() => setShowPassword(true)}
                                onMouseUp={() => setShowPassword(false)}
                                onMouseLeave={() => setShowPassword(false)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:text-red-500 transition-colors"
                            >
                                <Eye size={20} />
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 sm:py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Masuk
                    </button>
                </form>
            </div>
        </div>
        </div>
    );
}
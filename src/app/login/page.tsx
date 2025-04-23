"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Cookies from "js-cookie";
import { Eye, EyeOff } from "lucide-react"; // Import ikon mata
import Image from "next/image"; // Import Image from next/image

export default function LoginPage() {
    const [theme, setTheme] = useState(process.env.NEXT_PUBLIC_DEFAULT_THEME);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // const savedTheme = localStorage.getItem("theme") as "light" | "dark";
        // if (savedTheme) {
        //     setTheme(savedTheme);
        // }

        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
            setTheme(newTheme);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, password);
        const storedUser = Cookies.get("user");
        if (storedUser) {
            const user = JSON.parse(storedUser);
            redirectBasedOnRole(user.role);
        }
    };

    const redirectBasedOnRole = (role: string) => {
        router.push("/home");
    };

    return (
        <div className={`flex flex-col items-center justify-center min-h-screen dark:bg-gray-900 bg-gray-100 px-4`}>
            {/* Logo */}
            <div className="flex justify-center mb-6">
                <Image
                    className="h-14"
                    src={theme === "dark" ? "/logo_horizontal.svg" : "/logo_horizontal_d.svg"}
                    alt="logo"
                    width={200}
                    height={200}
                />
            </div>

            {/* Heading */}
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
                Hatch Your Idea
            </h1>

            {/* Login Form Card */}
            <div className={`w-full max-w-sm p-6 rounded-lg shadow-lg dark:bg-gray-800 bg-gray-100`}>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Login Form
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Please fill the form
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-gray-900 dark:text-white font-semibold mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none p-2 text-sm pl-4"
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <label className="block text-gray-900 dark:text-white font-semibold mb-1">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none p-2 text-sm pl-4"
                                required
                            />
                            {/* Eye Icon for Show/Hide Password */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-400"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="w-full dark:bg-gray-900 bg-gray-100 dark:text-[#41c2cb] p-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
                        disabled={isLoading}
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-gray-600 dark:text-gray-300 text-sm">
                With Idea Generator V2.0, get daily fresh ideas and monitor your competitors
            </p>
        </div>
    );
}

import axios from "axios";

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BE_BASE_URL,
    // timeout: 30000, // 30 seconds timeout
});

// Request interceptor: tambahkan token jika ada
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor: hapus token & redirect ke login jika 401
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login"; // Ganti sesuai path login kamu
        }
        return Promise.reject(error);
    }
);

export default instance;
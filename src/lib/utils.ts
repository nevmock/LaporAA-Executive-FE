import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Helper function untuk menggabungkan className secara dinamis.
 * - Menggunakan `clsx` untuk conditional class handling.
 * - Menggunakan `twMerge` untuk menghapus class Tailwind yang bentrok.
 */

export function cn(...classes: (string | undefined | null | boolean)[]) {
    return twMerge(clsx(classes));
}

/**
 * Debug logger that only outputs in development mode
 * Helps with debugging without polluting production logs
 */
export const debugLog = (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEBUG] ${message}`, ...args);
    }
};

/**
 * Safe function to handle potentially undefined values.
 * Returns a default value if the object property is undefined.
 */
export function safeValue<T, D>(value: T | undefined | null, defaultValue: D): T | D {
    return (value === undefined || value === null) ? defaultValue : value;
}

/**
 * Safe conversion of OPD value to array format
 * Handles both string and string[] types
 */
export function normalizeOpdValue(opd: string | string[] | undefined | null): string[] {
    if (!opd) return [];
    return Array.isArray(opd) ? opd : [opd];
}

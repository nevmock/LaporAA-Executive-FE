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

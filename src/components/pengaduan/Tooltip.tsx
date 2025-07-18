"use client";

import React from "react";

/**
 * Komponen Tooltip sederhana berbasis CSS murni, tanpa library eksternal.
 * Menampilkan keterangan kecil saat elemen di-hover.
 *
 * Props:
 * @param {string} text - Teks yang akan ditampilkan sebagai tooltip.
 * @param {React.ReactNode} children - Elemen yang dibungkus oleh tooltip.
 * @param {"top" | "bottom" | "left" | "right"} [position="right"] - Posisi tooltip relatif terhadap children.
 * @param {string} [className] - Opsional, class CSS tambahan untuk elemen pembungkus tooltip.
 */
interface TooltipProps {
    text: string;
    children: React.ReactNode;
    position?: "top" | "bottom" | "left" | "right";
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    text,
    children,
    position = "left",
    className = ""
}) => {
    // Mapping posisi ke class Tailwind
    const positionClass = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
        left: "right-full top-1/2 -translate-y-1/2 mr-2",
        right: "left-full top-1/2 -translate-y-1/2 ml-2"
    }[position];

    return (
        <span className={`relative inline-block group ${className}`}>
            {/* Elemen utama (anak yang dibungkus tooltip) */}
            {children}

            {/* Elemen tooltip */}
            <span
                className={`pointer-events-none absolute z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out ${positionClass}`}
            >
                {text}
            </span>
        </span>
    );
};

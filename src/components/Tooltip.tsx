"use client";

import React from "react";

/**
 * Simple, zero-dependency Tooltip component.
 *
 * Props:
 *  • text      – string yang akan ditampilkan di tooltip
 *  • position  – "top" | "bottom" | "left" | "right"  (default: "top")
 *  • className – kelas ekstra (optional)
 *
 * Cara pakai:
 *  <Tooltip text="Hello 👋">
 *      <button>Hover me</button>
 *  </Tooltip>
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
    position = "bottom",
    className = ""
}) => {
    // Posisi tooltip relatif terhadap elemen pemicu
    const positionClass = {
        top: "bottom-full left-1/2 -translate-x-1/2 mb-1 z-[1000]",
        bottom: "top-full left-1/2 -translate-x-1/2 mt-1 z-[1000]",
        left: "right-full top-1/2 -translate-y-1/2 mr-1 z-[1000]",
        right: "left-full top-1/2 -translate-y-1/2 ml-1 z-[1000]"
    }[position];

    return (
        <span className={`relative inline-block group ${className}`}>
            {/* Elemen trigger */}
            {children}

            {/* Tooltip */}
            <span
                className={`pointer-events-none absolute z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity duration-100 ease-out group-hover:opacity-100 group-focus:opacity-100 ${positionClass}`}
            >
                {text}
            </span>
        </span>
    );
};
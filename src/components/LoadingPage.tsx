// components/LoadingPage.tsx
"use client";
import React from "react";

export default function LoadingPage() {
    return (
        <div className="flex justify-center items-center h-[70vh] text-gray-600">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Loading</p>
            </div>
        </div>
    );
}

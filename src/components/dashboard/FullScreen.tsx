"use client";

import React, {
  useState,
  isValidElement,
  cloneElement,
  ReactNode,
  ReactElement,
} from "react";
import { createPortal } from "react-dom";
import { X, Maximize2 } from "lucide-react";

// Type tambahan untuk props anak komponen yang akan menerima state fullscreen
type FullScreenChildProps = {
  isFullscreen?: boolean;
};

// Komponen FullScreen menampilkan children dalam mode biasa dan bisa diperluas ke fullscreen (modal)
export default function FullScreen({
  children,
}: {
  title: string;
  children: ReactElement<FullScreenChildProps> | ReactNode;
}) {
  // State untuk mengatur apakah modal fullscreen sedang dibuka
  const [isOpen, setIsOpen] = useState(false);

  // Jika children adalah React element valid dan bukan elemen HTML biasa (seperti <div>),
  // maka kita clone dan tambahkan prop `isFullscreen` ke dalamnya
  const clonedChildren =
    isValidElement(children) && typeof children.type !== "string"
      ? cloneElement(children as ReactElement<FullScreenChildProps>, {
        isFullscreen: isOpen,
      })
      : children;

  // JSX untuk tampilan fullscreen modal
  const modal = (
    <div className="fixed inset-0 z-[999999] bg-white p-6 overflow-auto flex flex-col">
      {/* Tombol untuk menutup fullscreen */}
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-800 transition"
        >
          <X size={22} />
        </button>
      </div>

      {/* Konten utama yang diperbesar */}
      <div className="bg-gray-100 rounded-xl p-4 shadow-inner flex-1">
        {clonedChildren}
      </div>
    </div>
  );

  return (
    <>
      {/* Tampilan default (bukan fullscreen) dengan tombol untuk membuka fullscreen */}
      <div className="relative bg-white rounded-xl shadow p-4 w-full h-full">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={() => setIsOpen(true)}
            className="text-gray-500 hover:text-gray-800 transition"
          >
            <Maximize2 size={18} />
          </button>
        </div>
        {clonedChildren}
      </div>

      {/* Modal fullscreen ditampilkan melalui portal */}
      {isOpen && typeof window !== "undefined"
        ? createPortal(modal, document.body)
        : null}
    </>
  );
}
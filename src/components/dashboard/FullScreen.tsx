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

type FullScreenChildProps = {
  isFullscreen?: boolean;
};

export default function FullScreen({
  title,
  children,
}: {
  title: string;
  children: ReactElement<FullScreenChildProps> | ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const clonedChildren =
    isValidElement(children) && typeof children.type !== "string"
      ? cloneElement(children as ReactElement<FullScreenChildProps>, {
          isFullscreen: isOpen,
        })
      : children;

  const modal = (
    <div className="fixed inset-0 z-[9999] bg-white p-6 overflow-auto flex flex-col">
      <div className="flex justify-end items-center mb-4">
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-800 transition"
        >
          <X size={22} />
        </button>
      </div>
      <div className="bg-gray-100 rounded-xl p-4 shadow-inner flex-1">
        {clonedChildren}
      </div>
    </div>
  );

  return (
    <>
      {/* Normal card view with fullscreen button */}
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

      {/* Modal shown via portal */}
      {isOpen && typeof window !== "undefined"
        ? createPortal(modal, document.body)
        : null}
    </>
  );
}

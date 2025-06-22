import React from "react";

const LoadingModal: React.FC<{ open: boolean; text?: string }> = ({ open, text }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-sm flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
        <p className="text-gray-700 font-semibold">{text || "Sedang menyimpan..."}</p>
      </div>
    </div>
  );
};

export default React.memo(LoadingModal);

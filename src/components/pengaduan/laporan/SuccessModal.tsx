import React from "react";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ open, onClose, message }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]" onClick={onClose}>
      <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-md flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
        <div className="text-green-600 text-4xl">✓</div>
        <p className="text-gray-700 font-semibold">{message || "Data berhasil disimpan!"}</p>
        <button onClick={onClose} className="mt-2 px-4 py-2 bg-green-600 text-white rounded">Tutup</button>
      </div>
    </div>
  );
};

export default React.memo(SuccessModal);

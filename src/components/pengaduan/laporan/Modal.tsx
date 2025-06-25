import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  zIndex?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, maxWidth = "max-w-md", zIndex = "z-[9999]" }) => {
  if (!open) return null;
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${zIndex}`}
      onClick={onClose}
    >
      <div className={`bg-white p-6 rounded-md shadow-lg w-full ${maxWidth} space-y-4`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default React.memo(Modal);

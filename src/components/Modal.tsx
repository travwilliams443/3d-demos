import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  width?: number;
  height?: number;
}

export function Modal({ onClose, children, width = 640, height = 440 }: ModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl relative"
        style={{ width, height }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Close
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
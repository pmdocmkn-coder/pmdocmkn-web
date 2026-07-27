import React from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  altText?: string;
}

export default function ImageViewerModal({ isOpen, onClose, imageUrl, altText = "Image preview" }: ImageViewerModalProps) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-8" onClick={onClose}>
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 p-2 rounded-full transition-colors z-[101]"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </button>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={imageUrl} 
              alt={altText} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

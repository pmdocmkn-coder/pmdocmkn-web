import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion, PanInfo, useDragControls } from "framer-motion";
import { X } from "lucide-react";

/**
 * BottomSheet — Mobile dialog replacement
 * DESIGN.md specs:
 * - Backdrop: rgba(0,0,0,0.4)
 * - Drag handle: 32x4px, #CBD5E0, centered
 * - Border radius: 16px top corners only
 * - Default height: 60% viewport, draggable to 90%
 * - Animation: slide up 300ms ease-out
 */

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** "md" = 60vh (default), "lg" = 75vh, "xl" = 90vh */
  size?: "md" | "lg" | "xl";
  /** Hide the drag handle */
  noDragHandle?: boolean;
  contentClassName?: string;
}

const sizeMap = {
  md: "60vh",
  lg: "75vh",
  xl: "90vh",
};

const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  size = "md",
  noDragHandle = false,
  contentClassName = "px-5 py-4",
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on swipe down past threshold
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 80) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="bs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 md:hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="bs-sheet"
            ref={sheetRef}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white md:hidden flex flex-col"
            style={{
              borderRadius: "16px 16px 0 0",
              maxHeight: sizeMap[size],
              minHeight: "30vh",
            }}
          >
            {/* Header Area (Draggable) */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="touch-none flex-shrink-0 cursor-grab active:cursor-grabbing"
            >
              {/* Drag handle */}
              {!noDragHandle && (
                <div className="flex justify-center pt-3 pb-1">
                  <div
                    className="rounded-full"
                    style={{ width: 32, height: 4, backgroundColor: "#CBD5E0" }}
                  />
                </div>
              )}

              {/* Header */}
              {title && (
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0]">
                  <h2 className="text-[16px] font-semibold text-[#1A202C]">{title}</h2>
                  <button
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag when clicking close
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-[#718096] hover:text-[#1A202C] hover:bg-[#F7F8FA] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 overflow-y-auto overscroll-contain pb-safe ${contentClassName}`}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import BottomSheet from "./BottomSheet";
import { useResponsive } from "../../hooks/useResponsive";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Size for BottomSheet (md=60vh, lg=75vh, xl=90vh) */
  bottomSheetSize?: "md" | "lg" | "xl";
  /** Optional classname for DialogContent on desktop */
  desktopClassName?: string;
  /** Hide the drag handle on mobile */
  noDragHandle?: boolean;
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  bottomSheetSize = "md",
  desktopClassName = "max-w-md",
  noDragHandle = false,
}: ResponsiveModalProps) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onClose={() => onOpenChange(false)}
        title={title}
        size={bottomSheetSize}
        noDragHandle={noDragHandle}
      >
        {description && <div className="text-[14px] text-[#718096] mb-4">{description}</div>}
        {children}
        {footer && <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex gap-2 justify-end">{footer}</div>}
      </BottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`bg-white rounded-xl ${desktopClassName}`}>
        <DialogHeader>
          {title && <DialogTitle className="text-xl font-bold text-[#1A202C]">{title}</DialogTitle>}
          {description && <DialogDescription className="text-[14px] text-[#718096]">{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {footer && <DialogFooter className="mt-4 pt-4 border-t border-[#E2E8F0]">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

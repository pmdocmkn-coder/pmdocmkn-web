import React from "react";
import { cn } from "../../lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlassCard({ children, className, glowColor, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-[40px] p-8 md:p-10 relative overflow-hidden",
        className
      )}
      {...props}
    >
      {glowColor && (
        <div 
          className={cn(
            "absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[80px] pointer-events-none opacity-20",
            glowColor
          )} 
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FluxProgressProps {
  progress: number;
  className?: string;
}

export function FluxProgress({ progress, className = '' }: FluxProgressProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Slight delay for smooth initial animation
    const timer = setTimeout(() => setAnimatedProgress(progress), 100);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className={`relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden ${className}`}>
      {/* Background track inner shadow */}
      <div className="absolute inset-0 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] rounded-full z-10 pointer-events-none" />
      
      {/* Glowing animated flux bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${animatedProgress}%` }}
        transition={{ type: "spring", stiffness: 50, damping: 15, delay: 0.1 }}
        className="relative h-full rounded-full bg-gradient-to-r from-[#1B3A6B] via-[#2B6CB0] to-[#4299E1] overflow-hidden"
      >
        {/* Flux energy overlay */}
        <div className="absolute inset-0 w-full h-full opacity-50">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] animate-[flux_2s_ease-in-out_infinite]" style={{ backgroundSize: '200% 100%' }} />
        </div>
        
        {/* Top edge highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-white/30" />
      </motion.div>
      
      <style>{`
        @keyframes flux {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

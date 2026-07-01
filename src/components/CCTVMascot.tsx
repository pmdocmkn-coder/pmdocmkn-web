import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface CCTVMascotProps {
  isChecking: boolean;
  numLook: number; // 0 to 100
  isClosed: boolean;
  status: 'idle' | 'success' | 'fail';
}

export function CCTVMascot({ isChecking, numLook, isClosed, status }: CCTVMascotProps) {
  
  // Periodic smile state — mascot smiles every few seconds when idle
  const [isSmiling, setIsSmiling] = useState(false);

  useEffect(() => {
    const isIdle = !isChecking && !isClosed && status === 'idle';
    if (!isIdle) {
      setIsSmiling(false);
      return;
    }
    const interval = setInterval(() => {
      setIsSmiling(true);
      setTimeout(() => setIsSmiling(false), 2000); // smile lasts 2s
    }, 6000); // smile every 6s
    return () => clearInterval(interval);
  }, [isChecking, isClosed, status]);
  
  // Floating animation for the whole body
  const floatAnimation = {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  };

  const getHeadAnimation = () => {
    if (status === 'fail') {
      return {
        rotateY: [0, -25, 25, -25, 25, 0],
        rotateX: [0, 10, 10, 10, 10, 0],
        transition: { duration: 0.6 }
      };
    }
    
    if (status === 'success') {
      return {
        rotateX: [0, -20, 10, -10, 0],
        rotateY: 0,
        y: [0, -10, 0, -10, 0],
        transition: { duration: 0.8 }
      };
    }

    if (isClosed) {
      return {
        rotateY: 0,
        rotateX: -25,
        transition: { type: "spring" as const, stiffness: 150, damping: 20 }
      };
    }

    if (isChecking) {
      // Look side to side based on typing
      const panX = (numLook / 100) * 60 - 30; 
      return {
        rotateY: panX,
        rotateX: -15, // Look down at the form slightly
        transition: { type: "spring" as const, stiffness: 200, damping: 25 }
      };
    }

    // Idle
    return {
      rotateY: [0, -15, 15, -5, 0],
      rotateX: [0, -5, -5, 5, 0],
      transition: {
        repeat: Infinity,
        repeatDelay: 2.5,
        duration: 8,
        ease: "easeInOut" as const
      }
    };
  };

  // Expressive Dual Eye Animation
  const getEyeAnimation = (side: 'left' | 'right') => {
    if (status === 'fail') {
      return {
        height: '3px',
        width: '14px',
        backgroundColor: '#ef4444', // Red
        borderRadius: '10px',
        rotate: side === 'left' ? -15 : 15, // Angry brows
        transition: { duration: 0.3 }
      };
    }
    
    if (status === 'success') {
      return {
        height: '10px',
        width: '14px',
        backgroundColor: '#10b981', // Green
        borderRadius: '50% 50% 20% 20%', // Happy curve (like ^_^)
        transition: { type: "spring" as const }
      };
    }

    if (isClosed) {
      return {
        height: '2px',
        width: '14px',
        backgroundColor: '#60a5fa', // Cyan/Blue (sleeping)
        borderRadius: '2px 2px 10px 10px', // Curved line like the reference
        transition: { duration: 0.3 }
      };
    }

    // Default cute rounded eyes with blinking
    // If smiling, squint into happy arcs
    if (isSmiling) {
      return {
        height: '8px',
        width: '14px',
        backgroundColor: 'transparent', 
        borderStyle: 'solid',
        borderWidth: '3px 3px 0 3px',
        borderColor: '#38bdf8', // Light blue/cyan stroke
        borderRadius: '14px 14px 0px 0px', // Upward arc line ∩ ∩
        transition: { duration: 0.2 }
      };
    }

    return {
      height: ['12px', '2px', '12px'],
      width: '12px',
      backgroundColor: '#2B6CB0', // MKN Blue
      borderWidth: '0px',
      borderColor: 'transparent',
      borderRadius: '50%',
      transition: {
        height: {
          duration: 0.2,
          repeat: Infinity,
          repeatDelay: 3,
          times: [0, 0.5, 1]
        }
      }
    };
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative" style={{ perspective: '800px' }}>
      
      {/* Soft Ground Shadow */}
      <motion.div 
        className="absolute bottom-6 w-24 h-4 bg-black/30 rounded-[100%] blur-md"
        animate={{
          scale: [1, 0.8, 1],
          opacity: [0.3, 0.1, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Mascot Body */}
      <motion.div 
        className="relative z-30"
        animate={floatAnimation}
      >
        <motion.div
          animate={getHeadAnimation()}
          style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}
          className="relative"
        >
          {/* Back housing / depth */}
          <div className="absolute inset-0 bg-white/80 rounded-[30px] border border-white/20 blur-[1px]" style={{ transform: 'translateZ(-10px) scale(0.95)' }} />

          {/* Main White Shell */}
          <div className="w-[90px] h-[75px] bg-white rounded-[32px] shadow-[0_10px_25px_rgba(0,0,0,0.15),inset_0_-5px_15px_rgba(200,200,220,0.4)] flex items-center justify-center relative overflow-hidden p-1.5" style={{ transform: 'translateZ(0px)' }}>
            
            {/* Cute Little Antenna */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-slate-300 rounded-t-full shadow-inner" style={{ transform: 'translateZ(-5px)' }}>
               <div className="absolute -top-1.5 -left-1 w-3.5 h-3.5 bg-[#D94F2B] rounded-full shadow-[0_0_8px_rgba(217,79,43,0.8)]" />
            </div>

            {/* Black Screen Faceplate */}
            <div className="w-full h-full bg-slate-900 rounded-[26px] flex items-center justify-center relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)] overflow-hidden border border-slate-800">
              
              {/* Screen Glare */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[26px]" />
              <div className="absolute top-1 right-2 w-8 h-2.5 bg-white/10 rounded-full rotate-12 blur-[1px]" />
              
              {/* The Expressive Digital Eyes (Dual) */}
              <div className="flex items-center justify-center gap-2.5 relative">
                {/* Left Eye */}
                <motion.div 
                  animate={getEyeAnimation('left')}
                  style={{ originX: 0.5, originY: 0.5 }}
                />
                {/* Right Eye */}
                <motion.div 
                  animate={getEyeAnimation('right')}
                  style={{ originX: 0.5, originY: 0.5 }}
                />
              </div>
            </div>
          </div>
          
          {/* Side Pods (Ears) */}
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-3 h-8 bg-slate-100 rounded-l-full shadow-md border-y border-l border-slate-200 flex items-center justify-center" style={{ transform: 'translateZ(-5px)' }}>
            <div className="w-1 h-3 bg-[#D94F2B]/80 rounded-full blur-[1px]" />
          </div>
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-8 bg-slate-100 rounded-r-full shadow-md border-y border-r border-slate-200 flex items-center justify-center" style={{ transform: 'translateZ(-5px)' }}>
            <div className="w-1 h-3 bg-[#2B6CB0]/80 rounded-full blur-[1px]" />
          </div>
          
        </motion.div>
      </motion.div>
    </div>
  );
}

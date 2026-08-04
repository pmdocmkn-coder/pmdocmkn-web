import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CCTVMascotProps {
  isChecking: boolean;
  numLook: number; // 0 to 100
  isClosed: boolean;
  status: 'idle' | 'success' | 'fail';
  fieldSpan?: 'full' | 'left' | 'right';
}

type AnnoyedExpression =
  | 'terganggu'       // FULL FACE PNG (marah.png) + effect-marah2.png & effect-marah.png
  | 'tidakSabar'      // Mengantuk eyes (— —) + cemberut mouth + ⚙️
  | 'bingung'         // Bingung eyes (◉ ○) + terkejut mouth (O) + effect-tanda-tanya.png
  | 'kecewa'          // FULL FACE PNG (matakecewa.png - mata + mulut sudah jadi satu) + effect-tanda-seru.png
  | 'frustrasi'       // Senang eyes reversed (> <) + zigzag mouth + effect-garis-stress.png
  | 'sangatKesal'     // Sharp marah eyes (filled V) + cemberut + 💨 steam
  | 'senang';         // FULL FACE PNG (senang.png) + effect-berkilau.png sparkles ✨

const BLUE = '#3B82F6'; // Primary eye/mouth blue
const RED = '#EF4444';  // Anger effect red

export const CCTVMascot = React.memo(function CCTVMascot({ isChecking, numLook, isClosed, status, fieldSpan = 'full' }: CCTVMascotProps) {

  const [isSmiling, setIsSmiling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverRotateX, setHoverRotateX] = useState(0);
  const [hoverRotateY, setHoverRotateY] = useState(0);
  const [annoyedExpr, setAnnoyedExpr] = useState<AnnoyedExpression>('terganggu');
  const [hoverCount, setHoverCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Preload expression & effect PNG assets for instant display on hover
  useEffect(() => {
    const assetsToPreload = [
      '/maskot/mascot-expressions/marah.png',
      '/maskot/mascot-expressions/bingung.png',
      '/maskot/mascot-expressions/matakecewa.png',
      '/maskot/mascot-expressions/kesel.png',
      '/maskot/mascot-expressions/senang.png',
      '/maskot/mascot-effects/effect-marah2.png',
      '/maskot/mascot-effects/effect-marah.png',
      '/maskot/mascot-effects/fustasi2.png',
      '/maskot/mascot-effects/fustasi.png',
      '/maskot/mascot-effects/effect-tanda-tanya.png',
      '/maskot/mascot-effects/effect-tanda-seru.png',
      '/maskot/mascot-effects/effect-garis-stress.png',
      '/maskot/mascot-effects/effect-berkilau.png',
    ];
    assetsToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    const isIdle = !isChecking && !isClosed && status === 'idle' && !isHovered;
    if (!isIdle) { setIsSmiling(false); return; }
    const interval = setInterval(() => {
      setIsSmiling(true);
      setTimeout(() => setIsSmiling(false), 2000);
    }, 6000);
    return () => clearInterval(interval);
  }, [isChecking, isClosed, status, isHovered]);

  const pickExpression = useCallback(() => {
    const pool: AnnoyedExpression[] = hoverCount < 2
      ? ['terganggu', 'bingung', 'tidakSabar', 'senang']
      : hoverCount < 5
        ? ['kecewa', 'frustrasi', 'tidakSabar', 'senang']
        : ['terganggu', 'tidakSabar', 'bingung', 'kecewa', 'frustrasi', 'sangatKesal', 'senang'];
    setAnnoyedExpr(pool[Math.floor(Math.random() * pool.length)]);
  }, [hoverCount]);

  const handleMouseEnter = useCallback(() => {
    if (isChecking || isClosed || status !== 'idle') return;
    setIsHovered(true);
    setHoverCount(prev => prev + 1);
    pickExpression();
    setIsSmiling(false);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, [isChecking, isClosed, status, pickExpression]);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
      setHoverRotateX(0);
      setHoverRotateY(0);
    }, 300);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !isHovered) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    setHoverRotateY(Math.max(-35, Math.min(35, (dx / (rect.width / 2)) * 35)));
    setHoverRotateX(Math.max(-25, Math.min(25, -(dy / (rect.height / 2)) * 25)));
  }, [isHovered]);

  useEffect(() => () => { if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current); }, []);

  const isAnnoyedMode = isHovered && status === 'idle' && !isChecking && !isClosed;

  // ─── HEAD ANIMATION ───
  const getHeadAnimation = () => {
    if (isAnnoyedMode) {
      return { rotateY: hoverRotateY, rotateX: hoverRotateX, transition: { type: "spring" as const, stiffness: 300, damping: 20 } };
    }
    if (status === 'fail') return { rotateY: [0, -25, 25, -25, 25, 0], rotateX: [0, 10, 10, 10, 10, 0], transition: { duration: 0.6 } };
    if (status === 'success') return { rotateX: [0, -20, 10, -10, 0], rotateY: 0, y: [0, -10, 0, -10, 0], transition: { duration: 0.8 } };
    if (isClosed) return { rotateY: 0, rotateX: -25, transition: { type: "spring" as const, stiffness: 150, damping: 20 } };
    if (isChecking) {
      let panX = (numLook / 100) * 60 - 30;
      if (fieldSpan === 'left') panX = (numLook / 100) * 30 - 30;
      else if (fieldSpan === 'right') panX = (numLook / 100) * 30;
      return { rotateY: panX, rotateX: -15, transition: { type: "spring" as const, stiffness: 200, damping: 25 } };
    }
    return { rotateY: [0, -15, 15, -5, 0], rotateX: [0, -5, -5, 5, 0], transition: { repeat: Infinity, repeatDelay: 2.5, duration: 8, ease: "easeInOut" as const } };
  };

  // ─── STANDARD EYES (non-hover) ───
  const getEyeAnimation = (side: 'left' | 'right') => {
    if (status === 'fail') {
      return { height: '4px', width: '16px', backgroundColor: '#ef4444', borderRadius: '10px', rotate: side === 'left' ? -15 : 15, transition: { duration: 0.3 } };
    }
    if (status === 'success') {
      return { height: '12px', width: '16px', backgroundColor: '#10b981', borderRadius: '50% 50% 20% 20%', transition: { type: "spring" as const } };
    }
    if (isClosed) {
      return { height: '3px', width: '16px', backgroundColor: '#60a5fa', borderRadius: '2px 2px 10px 10px', transition: { duration: 0.3 } };
    }
    if (isSmiling) {
      return { height: '10px', width: '16px', backgroundColor: 'transparent', borderStyle: 'solid', borderWidth: '3.5px 3.5px 0 3.5px', borderColor: '#38bdf8', borderRadius: '16px 16px 0px 0px', transition: { duration: 0.2 } };
    }
    // DEFAULT/IDLE: Mata biru bulat dengan efek berkedip natural
    return { 
      height: ['14px', '2px', '14px'], 
      width: '14px', 
      scaleY: [1, 0.1, 1],
      backgroundColor: BLUE, 
      borderWidth: '0px', 
      borderColor: 'transparent', 
      borderRadius: '50%', 
      transition: { 
        height: { duration: 0.15, repeat: Infinity, repeatDelay: 3.5, times: [0, 0.5, 1], ease: "easeInOut" as const },
        scaleY: { duration: 0.15, repeat: Infinity, repeatDelay: 3.5, times: [0, 0.5, 1], ease: "easeInOut" as const }
      } 
    };
  };

  // ═══════════════════════════════════════════════
  // ANNOYED FACE — Eyes + Mouth rendered as one SVG
  // Matches the asset sheet exactly
  // ═══════════════════════════════════════════════
  const renderAnnoyedFace = () => {
    switch (annoyedExpr) {

      case 'terganggu':
        return (
          <div className="relative flex items-center justify-center">
            <img 
              src="/maskot/mascot-expressions/marah.png" 
              alt="ekspresi marah"
              className="w-[68px] h-auto object-contain drop-shadow-sm"
            />
          </div>
        );

      case 'tidakSabar':
        return (
          <svg width="48" height="30" viewBox="0 0 50 32" fill="none">
            <line x1="6" y1="12" x2="20" y2="12" stroke={BLUE} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="30" y1="12" x2="44" y2="12" stroke={BLUE} strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        );

      case 'bingung':
        return (
          <div className="relative flex items-center justify-center">
            <img 
              src="/maskot/mascot-expressions/bingung.png" 
              alt="ekspresi bingung"
              className="w-[68px] h-auto object-contain drop-shadow-sm"
            />
          </div>
        );

      case 'kecewa':
        return (
          <div className="relative flex items-center justify-center">
            <img 
              src="/maskot/mascot-expressions/matakecewa.png" 
              alt="ekspresi kecewa"
              className="w-[68px] h-auto object-contain drop-shadow-sm"
            />
          </div>
        );

      case 'frustrasi':
        return (
          <svg width="50" height="34" viewBox="0 0 50 34" fill="none">
            <path d="M 6,8 L 16,12 L 6,16 Z" fill={RED} opacity="0.9" />
            <line x1="6" y1="8" x2="16" y2="12" stroke={RED} strokeWidth="3.2" strokeLinecap="round" />
            <line x1="16" y1="12" x2="6" y2="16" stroke={RED} strokeWidth="3.2" strokeLinecap="round" />
            
            <path d="M 44,8 L 34,12 L 44,16 Z" fill={RED} opacity="0.9" />
            <line x1="44" y1="8" x2="34" y2="12" stroke={RED} strokeWidth="3.2" strokeLinecap="round" />
            <line x1="34" y1="12" x2="44" y2="16" stroke={RED} strokeWidth="3.2" strokeLinecap="round" />
            
            <path d="M16 27 L20 24 L25 28 L30 24 L34 27" stroke={RED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );

      case 'sangatKesal':
        return (
          <div className="relative flex items-center justify-center">
            <img 
              src="/maskot/mascot-expressions/kesel.png" 
              alt="ekspresi sangat kesel"
              className="w-[68px] h-auto object-contain drop-shadow-sm"
            />
          </div>
        );

      case 'senang':
        return (
          <div className="relative flex items-center justify-center">
            <img 
              src="/maskot/mascot-expressions/senang.png" 
              alt="ekspresi senang"
              className="w-[68px] h-auto object-contain drop-shadow-sm"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // ═══════════════════════════════════════════════
  // DECORATIONS — Effects rendered OUTSIDE the circle
  // Positioned relative to the floating body (z-40)
  // ═══════════════════════════════════════════════
  const renderDecorations = () => {
    switch (annoyedExpr) {

      case 'terganggu':
        // 💢 MARAH EFFECT: simbol marah manga
        return (
          <>
            <motion.img
              src="/maskot/mascot-effects/effect-marah2.png"
              alt="effect marah"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
              className="absolute -top-8 -left-7 z-40 w-8 h-8 drop-shadow-md"
            />
            <motion.img
              src="/maskot/mascot-effects/effect-marah.png"
              alt="effect marah"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
              exit={{ opacity: 0, scale: 0.8 }} 
              transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { repeat: Infinity, duration: 2, delay: 0.2, ease: "easeInOut" } }}
              className="absolute -top-6 -right-6 z-40 w-8 h-8 drop-shadow-md"
            />
          </>
        );

      case 'tidakSabar':
        // ⚙️ FRUSTRASI EFFECT
        return (
          <>
            <motion.img
              src="/maskot/mascot-effects/fustasi2.png"
              alt="effect frustrasi"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
              className="absolute -top-6 -right-6 z-40 w-8 h-8 drop-shadow-md"
            />
            <motion.img
              src="/maskot/mascot-effects/fustasi.png"
              alt="effect frustrasi"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { repeat: Infinity, duration: 2, delay: 0.2, ease: "easeInOut" } }}
              className="absolute -top-7 -left-5 z-40 w-8 h-8 drop-shadow-md"
            />
          </>
        );

      case 'bingung':
        // ? TANDA TANYA
        return (
          <motion.img
            src="/maskot/mascot-effects/effect-tanda-tanya.png"
            alt="effect tanda tanya"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { repeat: Infinity, duration: 1.8, ease: "easeInOut" } }}
            className="absolute -top-9 -right-5 z-40 w-8 h-9 drop-shadow-md object-contain"
          />
        );

      case 'kecewa':
        // ! TANDA SERU
        return (
          <motion.img
            src="/maskot/mascot-effects/effect-tanda-seru.png"
            alt="effect tanda seru"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { repeat: Infinity, duration: 1.8, ease: "easeInOut" } }}
            className="absolute -top-9 -right-4 z-40 w-7 h-9 drop-shadow-md object-contain"
          />
        );

      case 'frustrasi':
        // GARIS STRESS
        return (
          <>
            <motion.img
              src="/maskot/mascot-effects/effect-garis-stress.png"
              alt="effect stress"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-1/2 -left-8 z-40 w-7 h-10 drop-shadow-sm"
              style={{ transform: 'scaleX(-1) translateY(-50%)' }}
            />
            <motion.img
              src="/maskot/mascot-effects/effect-garis-stress.png"
              alt="effect stress"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-1/2 -right-8 z-40 w-7 h-10 drop-shadow-sm"
              style={{ transform: 'translateY(-50%)' }}
            />
          </>
        );

      case 'sangatKesal':
        // 💨 UAP KESAL
        return (
          <>
            <motion.svg
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.8, 0], y: -16 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-5 -left-5 z-40" width="28" height="22" viewBox="0 0 28 22"
            >
              <circle cx="8" cy="14" r="5" fill="#F87171" opacity="0.6" />
              <circle cx="16" cy="10" r="6" fill="#F87171" opacity="0.5" />
              <circle cx="22" cy="14" r="4" fill="#F87171" opacity="0.4" />
            </motion.svg>
            <motion.svg
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.8, 0], y: -16 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              className="absolute -top-5 -right-5 z-40" width="28" height="22" viewBox="0 0 28 22"
            >
              <circle cx="6" cy="14" r="4" fill="#F87171" opacity="0.4" />
              <circle cx="12" cy="10" r="6" fill="#F87171" opacity="0.5" />
              <circle cx="20" cy="14" r="5" fill="#F87171" opacity="0.6" />
            </motion.svg>
          </>
        );

      case 'senang':
        // ✨ SPARKLES — ukuran stabil konsisten
        return (
          <>
            <motion.img
              src="/maskot/mascot-effects/effect-berkilau.png"
              alt="effect berkilau"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
              className="absolute -top-8 -left-7 z-40 w-9 h-9 drop-shadow-md"
            />
            <motion.img
              src="/maskot/mascot-effects/effect-berkilau.png"
              alt="effect berkilau"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1, y: [0, -3, 0] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ opacity: { duration: 0.15 }, scale: { duration: 0.15 }, y: { repeat: Infinity, duration: 2, delay: 0.3, ease: "easeInOut" } }}
              className="absolute -top-6 -right-6 z-40 w-8 h-8 drop-shadow-md"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center relative cursor-pointer"
      style={{ perspective: '800px' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Ground Shadow */}
      <motion.div
        className="absolute bottom-6 w-24 h-4 bg-black/30 rounded-[100%] blur-md"
        animate={{ scale: [1, 0.8, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating Body */}
      <motion.div
        className="relative z-30"
        animate={isAnnoyedMode
          ? { y: [0, -3, 0], transition: { duration: 0.5, repeat: Infinity } }
          : { y: [0, -8, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const } }
        }
      >
        {/* Decorations — rendered OUTSIDE the robot, floats beyond circle */}
        <AnimatePresence>
          {isAnnoyedMode && renderDecorations()}
        </AnimatePresence>

        <motion.div
          animate={getHeadAnimation()}
          style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}
          className="relative"
        >
          {/* Back depth layer */}
          <div className="absolute inset-0 bg-white/80 rounded-[30px] border border-white/20 blur-[1px]" style={{ transform: 'translateZ(-10px) scale(0.95)' }} />

          {/* Main White Shell */}
          <div className="w-[90px] h-[75px] bg-white rounded-[32px] shadow-[0_10px_25px_rgba(0,0,0,0.15),inset_0_-5px_15px_rgba(200,200,220,0.4)] flex items-center justify-center relative overflow-hidden p-1.5" style={{ transform: 'translateZ(0px)' }}>

            {/* Antenna */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1.5 h-4 bg-slate-300 rounded-t-full shadow-inner" style={{ transform: 'translateZ(-5px)' }}>
              <motion.div
                className="absolute -top-1.5 -left-1 w-3.5 h-3.5 rounded-full shadow-[0_0_8px_rgba(217,79,43,0.8)]"
                animate={{ backgroundColor: isAnnoyedMode ? ['#D94F2B', '#ef4444', '#D94F2B'] : '#D94F2B' }}
                transition={isAnnoyedMode ? { duration: 0.5, repeat: Infinity } : {}}
              />
            </div>

            {/* Black Screen Face */}
            <div className="w-full h-full bg-slate-900 rounded-[26px] flex items-center justify-center relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)] overflow-hidden border border-slate-800">

              {/* Screen Glare */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-[26px]" />
              <div className="absolute top-1 right-2 w-8 h-2.5 bg-white/10 rounded-full rotate-12 blur-[1px]" />

              {/* FACE: Eyes + Mouth */}
              <AnimatePresence>
                {isAnnoyedMode ? (
                  <motion.div
                    key={`annoyed-${annoyedExpr}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                  >
                    {renderAnnoyedFace()}
                  </motion.div>
                ) : (
                  <motion.div
                    key="normal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                    className="absolute inset-0 flex items-center justify-center gap-2.5 z-10 pointer-events-none"
                  >
                    <motion.div animate={getEyeAnimation('left')} style={{ originX: 0.5, originY: 0.5 }} />
                    <motion.div animate={getEyeAnimation('right')} style={{ originX: 0.5, originY: 0.5 }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Side Pods (Ears) */}
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-3 h-8 bg-slate-100 rounded-l-full shadow-md border-y border-l border-slate-200 flex items-center justify-center" style={{ transform: 'translateZ(-5px)' }}>
            <motion.div className="w-1 h-3 rounded-full blur-[1px]" animate={{ backgroundColor: isAnnoyedMode ? '#ef4444' : 'rgba(217,79,43,0.8)' }} />
          </div>
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-8 bg-slate-100 rounded-r-full shadow-md border-y border-r border-slate-200 flex items-center justify-center" style={{ transform: 'translateZ(-5px)' }}>
            <motion.div className="w-1 h-3 rounded-full blur-[1px]" animate={{ backgroundColor: isAnnoyedMode ? '#ef4444' : 'rgba(43,108,176,0.8)' }} />
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
});

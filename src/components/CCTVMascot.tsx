import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';

interface CCTVMascotProps {
  isChecking: boolean;
  numLook: number; // 0 to 100
  isClosed: boolean;
  status: 'idle' | 'success' | 'fail';
  fieldSpan?: 'full' | 'left' | 'right';
}

type AnnoyedExpression =
  | 'terganggu'       // Marah eyes (half-moon crescent) + no mouth + effect-marah2.png & effect-marah.png
  | 'tidakSabar'      // Mengantuk eyes (— —) + cemberut mouth + ⚙️
  | 'bingung'         // Bingung eyes (◉ ○) + terkejut mouth (O) + effect-tanda-tanya.png
  | 'kecewa'          // Marah eyes (\ /) + forked mouth (>-<) + effect-tanda-seru.png [ORIGINAL - User's favorite!]
  | 'frustrasi'       // Senang eyes reversed (> <) + zigzag mouth + effect-garis-stress.png
  | 'sangatKesal';    // Sharp marah eyes (filled V) + cemberut + 💨 steam

const BLUE = '#3B82F6'; // Primary eye/mouth blue
const RED = '#EF4444';  // Anger effect red

export function CCTVMascot({ isChecking, numLook, isClosed, status, fieldSpan = 'full' }: CCTVMascotProps) {

  const [isSmiling, setIsSmiling] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverRotateX, setHoverRotateX] = useState(0);
  const [hoverRotateY, setHoverRotateY] = useState(0);
  const [annoyedExpr, setAnnoyedExpr] = useState<AnnoyedExpression>('terganggu');
  const [hoverCount, setHoverCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      ? ['terganggu', 'bingung', 'tidakSabar']
      : hoverCount < 5
        ? ['kecewa', 'frustrasi', 'tidakSabar']
        : ['terganggu', 'tidakSabar', 'bingung', 'kecewa', 'frustrasi', 'sangatKesal'];
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
      return { height: '3px', width: '14px', backgroundColor: '#ef4444', borderRadius: '10px', rotate: side === 'left' ? -15 : 15, transition: { duration: 0.3 } };
    }
    if (status === 'success') {
      return { height: '10px', width: '14px', backgroundColor: '#10b981', borderRadius: '50% 50% 20% 20%', transition: { type: "spring" as const } };
    }
    if (isClosed) {
      return { height: '2px', width: '14px', backgroundColor: '#60a5fa', borderRadius: '2px 2px 10px 10px', transition: { duration: 0.3 } };
    }
    if (isSmiling) {
      return { height: '8px', width: '14px', backgroundColor: 'transparent', borderStyle: 'solid', borderWidth: '3px 3px 0 3px', borderColor: '#38bdf8', borderRadius: '14px 14px 0px 0px', transition: { duration: 0.2 } };
    }
    return { height: ['12px', '2px', '12px'], width: '12px', backgroundColor: BLUE, borderWidth: '0px', borderColor: 'transparent', borderRadius: '50%', transition: { height: { duration: 0.2, repeat: Infinity, repeatDelay: 3, times: [0, 0.5, 1] } } };
  };

  // ═══════════════════════════════════════════════
  // ANNOYED FACE — Eyes + Mouth rendered as one SVG
  // Matches the asset sheet exactly
  // ═══════════════════════════════════════════════
  const renderAnnoyedFace = () => {
    // All faces rendered inside a 50x32 viewBox
    // Eyes occupy top portion, mouth at bottom
    switch (annoyedExpr) {

      case 'terganggu':
        // MARAH EYES: Bentuk setengah bulan (crescent/half-moon) yang tajam dan mengerikan
        // NO MOUTH — hanya mata marah setengah lingkaran
        return (
          <div className="relative flex flex-col items-center">
            {/* Mata marah: bentuk crescent/half-moon yang tajam */}
            <svg width="50" height="20" viewBox="0 0 50 20" fill="none">
              {/* Left angry eye: half-moon shape (bottom half of circle) */}
              <path d="M 6,10 Q 6,6 13,6 Q 20,6 20,10 Q 20,14 13,14 Q 6,14 6,10 Z" fill={BLUE} />
              {/* Right angry eye: symmetrical half-moon */}
              <path d="M 30,10 Q 30,6 37,6 Q 44,6 44,10 Q 44,14 37,14 Q 30,14 30,10 Z" fill={BLUE} />
            </svg>
          </div>
        );

      case 'tidakSabar':
        // MENGANTUK/TIDAK SABAR EYES: mata setengah tertutup horizontal (— —)
        // CEMBERUT MOUTH: mulut cemberut lurus
        return (
          <svg width="50" height="32" viewBox="0 0 50 32" fill="none">
            {/* Left eye: garis horizontal tebal (mata setengah tertutup) */}
            <line x1="6" y1="11" x2="20" y2="11" stroke={BLUE} strokeWidth="4" strokeLinecap="round" />
            {/* Right eye: garis horizontal tebal */}
            <line x1="30" y1="11" x2="44" y2="11" stroke={BLUE} strokeWidth="4" strokeLinecap="round" />
            {/* Cemberut mouth: garis lurus dengan sedikit lengkungan ke bawah */}
            <path d="M17 26 Q25 28 33 26" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        );

      case 'bingung':
        // BINGUNG EYES: satu mata besar bulat penuh, satu mata kecil (asimetris khas bingung)
        // TERKEJUT MOUTH: mulut O kecil
        return (
          <svg width="50" height="34" viewBox="0 0 50 34" fill="none">
            {/* Left eye: MATA BESAR bulat penuh */}
            <circle cx="13" cy="11" r="8" fill={BLUE} />
            <circle cx="13" cy="11" r="3" fill="white" opacity="0.4" />
            
            {/* Right eye: MATA KECIL */}
            <circle cx="38" cy="13" r="5" fill={BLUE} />
            <circle cx="38" cy="13" r="2" fill="white" opacity="0.3" />
            
            {/* Surprised O mouth - lebih besar */}
            <circle cx="25" cy="27" r="4" stroke={BLUE} strokeWidth="2.5" fill="none" />
          </svg>
        );

      case 'kecewa':
        // MARAH EYES: Filled shapes, flat angled top, curved bottom (half-circles)
        // SQUIGGLY MOUTH: Horizontal line with forked ends (>-<)
        return (
          <svg width="50" height="34" viewBox="0 0 50 34" fill="none">
            {/* Left angry eye: Slightly curved brow, deep curved belly */}
            <path d="M 11,11 Q 16,11 20,15 Q 15,21 11,11 Z" fill={BLUE} stroke={BLUE} strokeWidth="3" strokeLinejoin="round" />
            {/* Right angry eye: Symmetrical */}
            <path d="M 39,11 Q 34,11 30,15 Q 35,21 39,11 Z" fill={BLUE} stroke={BLUE} strokeWidth="3" strokeLinejoin="round" />
            {/* Forked squiggly mouth >-< : more compact forks */}
            <path d="M 20,25.5 L 22,27 L 28,27 L 30,25.5 M 20,28.5 L 22,27 M 28,27 L 30,28.5" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );

      case 'frustrasi':
        // MATA FRUSTRASI: mata dipicingkan kuat dengan sudut tajam (> <)
        // MARAH MOUTH: zigzag mouth menunjukkan frustrasi
        return (
          <svg width="50" height="34" viewBox="0 0 50 34" fill="none">
            {/* Left eye: > chevron dengan stroke lebih tebal dan filled area */}
            <path d="M 6,8 L 16,12 L 6,16 Z" fill={RED} opacity="0.8" />
            <line x1="6" y1="8" x2="16" y2="12" stroke={RED} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="16" y1="12" x2="6" y2="16" stroke={RED} strokeWidth="3.5" strokeLinecap="round" />
            
            {/* Right eye: < chevron dengan filled area */}
            <path d="M 44,8 L 34,12 L 44,16 Z" fill={RED} opacity="0.8" />
            <line x1="44" y1="8" x2="34" y2="12" stroke={RED} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="34" y1="12" x2="44" y2="16" stroke={RED} strokeWidth="3.5" strokeLinecap="round" />
            
            {/* Marah zigzag mouth: lebih tajam */}
            <path d="M16 27 L20 24 L25 28 L30 24 L34 27" stroke={RED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        );

      case 'sangatKesal':
        // SHARP MARAH EYES: Mata marah ekstra tajam dengan bentuk V yang lebih dalam
        // CEMBERUT MOUTH: mulut cemberut datar
        return (
          <svg width="50" height="34" viewBox="0 0 50 34" fill="none">
            {/* Left eye: mata marah tajam dengan bentuk filled */}
            <path d="M 4,6 L 18,12 L 16,16 L 8,14 Z" fill={BLUE} />
            {/* Right eye: simetris, lebih tajam */}
            <path d="M 46,6 L 32,12 L 34,16 L 42,14 Z" fill={BLUE} />
            {/* Cemberut: angry downward mouth */}
            <path d="M16 28 Q25 25 34 28" stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
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
        // 💢 MARAH EFFECT: Menggunakan effect-marah2.png (simbol marah manga)
        return (
          <>
            <motion.img
              src="/maskot/mascot-effects/effect-marah2.png"
              alt="effect marah"
              initial={{ opacity: 0, scale: 0 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-8 -left-7 z-40 w-8 h-8 drop-shadow-md"
            />
            <motion.img
              src="/maskot/mascot-effects/effect-marah.png"
              alt="effect marah"
              initial={{ opacity: 0, scale: 0 }} 
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }} 
              transition={{ delay: 0.12 }}
              className="absolute -top-6 -right-6 z-40 w-7 h-7 drop-shadow-md"
            />
          </>
        );

      case 'tidakSabar':
        // ⚙️ SPINNING GEAR — rendered as SVG gear
        return (
          <motion.svg
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.7, rotate: 360 }}
            exit={{ opacity: 0 }}
            transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.3 } }}
            className="absolute -top-5 -right-5 z-40" width="28" height="28" viewBox="0 0 24 24"
          >
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#94A3B8" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
          </motion.svg>
        );

      case 'bingung':
        // ? TANDA TANYA — menggunakan effect-tanda-tanya.png
        return (
          <motion.img
            src="/maskot/mascot-effects/effect-tanda-tanya.png"
            alt="effect tanda tanya"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" } }}
            className="absolute -top-8 -right-5 z-40 w-7 h-9 drop-shadow-md"
          />
        );

      case 'kecewa':
        // ! TANDA SERU — menggunakan effect-tanda-seru.png
        return (
          <motion.img
            src="/maskot/mascot-effects/effect-tanda-seru.png"
            alt="effect tanda seru"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: [1, 1.2, 1] }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ scale: { repeat: Infinity, duration: 1 } }}
            className="absolute -top-8 -right-3 z-40 w-6 h-9 drop-shadow-md"
          />
        );

      case 'frustrasi':
        // GARIS STRESS — menggunakan effect-garis-stress.png di kedua sisi
        return (
          <>
            <motion.img
              src="/maskot/mascot-effects/effect-garis-stress.png"
              alt="effect stress"
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: [0.5, 1, 0.5], x: [2, 0, 2] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="absolute top-1/2 -translate-y-1/2 -left-8 z-40 w-7 h-10 drop-shadow-sm"
              style={{ transform: 'scaleX(-1) translateY(-50%)' }}
            />
            <motion.img
              src="/maskot/mascot-effects/effect-garis-stress.png"
              alt="effect stress"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: [0.5, 1, 0.5], x: [-2, 0, -2] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
              className="absolute top-1/2 -translate-y-1/2 -right-8 z-40 w-7 h-10 drop-shadow-sm"
            />
          </>
        );

      case 'sangatKesal':
        // 💨 UAP KESAL — steam cloud puffs floating up from both sides
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
              <AnimatePresence mode="wait">
                {isAnnoyedMode ? (
                  <motion.div
                    key={`annoyed-${annoyedExpr}`}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 25 }}
                    className="relative z-10 flex items-center justify-center"
                  >
                    {renderAnnoyedFace()}
                  </motion.div>
                ) : (
                  <motion.div
                    key="normal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center gap-2.5 relative z-10"
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
}

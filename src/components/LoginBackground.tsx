import React from 'react';

export const LoginBackground: React.FC = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#08182F]">
      {/* Background image — bgweb.png (BTS towers, city, HT radio) */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bgweb.png')" }}
      />

      {/* Dark gradient overlay for readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-[#08182F]/60 via-[#08182F]/30 to-[#08182F]/70" />

      {/* Subtle radial glow behind center (card area) */}
      <div
        className="absolute inset-0 z-20"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 45%, rgba(43,108,176,0.12) 0%, transparent 70%)',
        }}
      />

      {/* Top vignette for depth */}
      <div className="absolute inset-0 z-30 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(8,24,47,0.8)_0%,transparent_60%)]" />

      {/* Bottom vignette for footer contrast */}
      <div className="absolute inset-0 z-30 bg-[linear-gradient(180deg,transparent_60%,rgba(8,24,47,0.6)_100%)]" />
    </div>
  );
});

import { useEffect, useRef } from "react";

export default function Logo({ size = 36, className = "" }) {
  const arrow1Ref = useRef(null);
  const arrow2Ref = useRef(null);

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 48 48" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFD1" />
          <stop offset="100%" stopColor="#8458FF" />
        </linearGradient>
        <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8458FF" />
          <stop offset="100%" stopColor="#00FFD1" />
        </linearGradient>
        <style>{`
          @keyframes spinCW  { from { transform-origin: 24px 24px; transform: rotate(0deg);   } to { transform-origin: 24px 24px; transform: rotate(360deg);  } }
          @keyframes spinCCW { from { transform-origin: 24px 24px; transform: rotate(0deg);   } to { transform-origin: 24px 24px; transform: rotate(-360deg); } }
          @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
          .arc-outer { animation: spinCW  4s linear infinite; }
          .arc-inner { animation: spinCCW 3s linear infinite; }
          .z-path    { animation: pulse  2s ease-in-out infinite; }
        `}</style>
      </defs>

      {/* Outer rotating arc */}
      <g className="arc-outer">
        <path d="M24 5 A19 19 0 0 1 43 24" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M43 24 A19 19 0 0 1 24 43" stroke="url(#lg1)" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="6 3"/>
        {/* Arrow head */}
        <path d="M21 3.5 L24 5 L21 7" stroke="#00FFD1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>

      {/* Inner counter-rotating arc */}
      <g className="arc-inner">
        <path d="M24 43 A19 19 0 0 1 5 24" stroke="url(#lg2)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M5 24 A19 19 0 0 1 24 5" stroke="url(#lg2)" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="6 3"/>
        {/* Arrow head */}
        <path d="M27 44.5 L24 43 L27 41" stroke="#8458FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>

      {/* Z shape — pulsing */}
      <path className="z-path"
        d="M17 18 L31 18 L17 30 L31 30"
        stroke="url(#lg1)" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
}

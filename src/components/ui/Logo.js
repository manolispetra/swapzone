export default function Logo({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFD1" />
          <stop offset="100%" stopColor="#8458FF" />
        </linearGradient>
      </defs>
      {/* Outer ring - swap arrows */}
      <path
        d="M24 6 C14.06 6 6 14.06 6 24"
        stroke="url(#logoGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 24 C6 33.94 14.06 42 24 42"
        stroke="url(#logoGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="4 2"
      />
      <path
        d="M24 42 C33.94 42 42 33.94 42 24"
        stroke="url(#logoGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M42 24 C42 14.06 33.94 6 24 6"
        stroke="url(#logoGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="4 2"
      />
      {/* Arrow head top-right */}
      <path d="M20 4 L24 6 L20 8" stroke="#00FFD1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Arrow head bottom-left */}
      <path d="M28 44 L24 42 L28 40" stroke="#8458FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Z shape for liquidity flow */}
      <path
        d="M17 18 L31 18 L17 30 L31 30"
        stroke="url(#logoGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

import React, { useId } from 'react';

interface FishIllustrationProps {
  accentFrom: string;
  accentTo: string;
  className?: string;
  isNightMode?: boolean;
  variant?: number;
}

const FishIllustration: React.FC<FishIllustrationProps> = ({
  accentFrom,
  accentTo,
  className = '',
  isNightMode = false,
  variant = 0,
}) => {
  const uid = useId();
  const flipped = variant % 2 === 1;

  const bubblePositions = [
    { cx: 34 + (variant % 3) * 8, cy: 28, r: 3.2 },
    { cx: 146, cy: 22 + (variant % 2) * 6, r: 4.1 },
    { cx: 132 - (variant % 3) * 4, cy: 92, r: 2.6 },
  ];

  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] border ${
        isNightMode ? 'border-cyan-900/30 bg-slate-950/45' : 'border-sky-100 bg-white/58'
      } ${className}`}
    >
      <svg className="block h-full w-full" viewBox="0 0 180 120" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${uid}-backdrop`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isNightMode ? '#0f172a' : '#f8fdff'} />
            <stop offset="100%" stopColor={isNightMode ? '#082f49' : '#dcfce7'} />
          </linearGradient>
          <radialGradient id={`${uid}-glow`} cx="50%" cy="42%" r="42%">
            <stop offset="0%" stopColor={accentTo} stopOpacity={isNightMode ? '0.4' : '0.64'} />
            <stop offset="100%" stopColor={accentFrom} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${uid}-body`} x1="20%" y1="25%" x2="80%" y2="80%">
            <stop offset="0%" stopColor={accentFrom} />
            <stop offset="48%" stopColor={accentTo} />
            <stop offset="100%" stopColor={accentFrom} />
          </linearGradient>
          <linearGradient id={`${uid}-tail`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentTo} />
            <stop offset="100%" stopColor={accentFrom} />
          </linearGradient>
        </defs>

        <rect width="180" height="120" fill={`url(#${uid}-backdrop)`} />
        <circle cx="92" cy="54" r="42" fill={`url(#${uid}-glow)`} opacity={isNightMode ? 0.46 : 0.72} />

        <path
          d="M10 23 C28 10 54 9 77 23 C61 28 44 34 29 44 C24 35 18 28 10 23 Z"
          fill={accentTo}
          opacity={isNightMode ? 0.12 : 0.18}
        />
        <path
          d="M140 99 C154 87 163 72 170 58 C169 76 165 91 158 102 C151 102 146 101 140 99 Z"
          fill={accentFrom}
          opacity={isNightMode ? 0.1 : 0.16}
        />

        <g transform={flipped ? 'translate(180 0) scale(-1 1)' : undefined}>
          <ellipse cx="92" cy="60" rx="34" ry="20" fill={`url(#${uid}-body)`} />
          <path d="M58 60 C42 47 28 39 16 30 C20 49 20 71 16 90 C28 81 42 73 58 60 Z" fill={`url(#${uid}-tail)`} />
          <path
            d="M79 47 C90 42 103 40 118 40 C109 49 106 56 102 61 C93 58 86 54 79 47 Z"
            fill="rgba(255,255,255,0.18)"
          />
          <path
            d="M77 67 C85 72 96 73 106 70"
            stroke="rgba(255,255,255,0.88)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="110" cy="57" r="4.5" fill="rgba(255,255,255,0.95)" />
          <circle cx="111" cy="57" r="1.7" fill="#0f172a" />
          <path
            d="M84 53 C89 49 94 48 99 48"
            stroke="rgba(255,255,255,0.62)"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        <path
          d="M20 97 C39 83 66 84 86 90 C104 95 125 95 160 82"
          stroke={isNightMode ? 'rgba(103,232,249,0.22)' : 'rgba(14,165,233,0.28)'}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />

        {bubblePositions.map((bubble, index) => (
          <g key={`${uid}-bubble-${index}`}>
            <circle
              cx={bubble.cx}
              cy={bubble.cy}
              r={bubble.r}
              fill="rgba(255,255,255,0.62)"
            />
            <circle
              cx={bubble.cx + 1.2}
              cy={bubble.cy - 1.1}
              r={Math.max(bubble.r - 1.4, 0.8)}
              fill={isNightMode ? 'rgba(186,230,253,0.26)' : 'rgba(255,255,255,0.24)'}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default FishIllustration;

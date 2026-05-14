import React from 'react';

const ChristmasTree: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 sm:left-4 z-0 pointer-events-none opacity-80 select-none hidden min-[1100px]:block">
      {/* 
        hidden min-[1100px]:block -> 在宽度小于1100px的屏幕上隐藏，
        避免在小屏笔记本或平板上与左侧工具栏重叠过多显得杂乱。
        在宽屏上显示作为装饰。
      */}
      <svg
        width="300"
        height="400"
        viewBox="0 0 200 300"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-2xl"
      >
        <style>
          {`
            @keyframes twinkle {
              0%, 100% { opacity: 0.4; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
            .light { animation: twinkle 2s infinite ease-in-out; }
            .light-1 { animation-delay: 0s; }
            .light-2 { animation-delay: 0.5s; }
            .light-3 { animation-delay: 1s; }
            .light-4 { animation-delay: 1.5s; }
            
            @keyframes glow {
              0%, 100% { filter: drop-shadow(0 0 2px #fbbf24); }
              50% { filter: drop-shadow(0 0 8px #fbbf24); }
            }
            .star { animation: glow 3s infinite ease-in-out; }
          `}
        </style>

        {/* 树干 */}
        <rect x="90" y="250" width="20" height="40" fill="#5D4037" />

        {/* 树叶 - 三层结构 */}
        {/* 底层 */}
        <path d="M40 250 L160 250 L100 150 Z" fill="#1B5E20" />
        <path d="M40 250 L160 250 L100 150 Z" fill="rgba(255,255,255,0.1)" transform="scale(0.9) translate(10,10)" /> {/* 质感高光 */}

        {/* 中层 */}
        <path d="M50 180 L150 180 L100 90 Z" fill="#2E7D32" />
        <path d="M50 180 L150 180 L100 90 Z" fill="rgba(255,255,255,0.1)" transform="scale(0.9) translate(10,10)" />

        {/* 顶层 */}
        <path d="M60 110 L140 110 L100 30 Z" fill="#43A047" />

        {/* 装饰彩带 (简化为线条) */}
        <path d="M70 220 Q100 240 130 210" fill="none" stroke="#FFC107" strokeWidth="2" opacity="0.6" />
        <path d="M80 150 Q100 170 120 140" fill="none" stroke="#FFC107" strokeWidth="2" opacity="0.6" />

        {/* 装饰彩灯 */}
        <circle cx="70" cy="240" r="4" fill="#ef4444" className="light light-1" />
        <circle cx="130" cy="230" r="4" fill="#3b82f6" className="light light-2" />
        <circle cx="100" cy="200" r="4" fill="#fbbf24" className="light light-3" />
        
        <circle cx="65" cy="170" r="4" fill="#fbbf24" className="light light-2" />
        <circle cx="135" cy="160" r="4" fill="#ef4444" className="light light-4" />
        <circle cx="100" cy="140" r="4" fill="#ec4899" className="light light-1" />

        <circle cx="80" cy="100" r="4" fill="#3b82f6" className="light light-3" />
        <circle cx="120" cy="90" r="4" fill="#fbbf24" className="light light-2" />

        {/* 树顶星星 */}
        <path 
          d="M100 10 L105 25 L120 25 L108 35 L112 50 L100 40 L88 50 L92 35 L80 25 L95 25 Z" 
          fill="#FFD700" 
          className="star"
        />
      </svg>
    </div>
  );
};

export default ChristmasTree;


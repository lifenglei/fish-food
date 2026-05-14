import React from 'react';

const ShootingStarTitle: React.FC = () => {
  return (
    <div className="fixed top-32 left-8 z-50 pointer-events-none select-none">
      <div className="relative group transform -rotate-12 hover:rotate-0 transition-transform duration-500 origin-bottom-left">
        {/* 主要文字容器 */}
        <div className="flex flex-col-reverse items-start">
           {/* Created By 放在下面 */}
           <span className="text-[10px] text-amber-700/60 font-bold uppercase tracking-[0.2em] ml-1 mt-1 transform skew-x-12">
             Created By
           </span>
           
           <h3 className="text-5xl font-black tracking-tighter transform -skew-x-12">
             {/* 鎏金流星文字效果 */}
             <span 
                className="bg-clip-text text-transparent bg-gradient-to-r from-amber-700 via-yellow-200 to-amber-700 bg-[length:200%_auto] animate-shine"
                style={{ 
                  textShadow: '0 2px 10px rgba(251, 191, 36, 0.3)',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'
                }}
             >
               端哥
             </span>
           </h3>
        </div>

        {/* 装饰性的小星星 - 位置调整 */}
        <div className="absolute -top-2 -right-4 w-3 h-3 bg-yellow-100 rounded-full blur-[1px] animate-ping opacity-90 shadow-[0_0_10px_rgba(253,224,71,0.8)]"></div>
        <div className="absolute top-1/2 -right-8 w-16 h-[1px] bg-gradient-to-r from-yellow-200 to-transparent opacity-50"></div>
      </div>

      <style>{`
        @keyframes shine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .animate-shine {
          animation: shine 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ShootingStarTitle;

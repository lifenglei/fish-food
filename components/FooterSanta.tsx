import React from 'react';

interface FooterSantaProps {
  isNightMode?: boolean;
}

const FooterSanta: React.FC<FooterSantaProps> = ({ isNightMode = false }) => {
  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 -mb-10 z-20 pointer-events-none flex justify-center md:justify-end">
      <div className="relative w-[280px] md:w-[350px] lg:w-[400px] transition-all duration-1000">
        {/* 光晕背景 */}
        <div 
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-radial from-white/20 to-transparent blur-3xl opacity-50 transition-opacity duration-1000 ${
            isNightMode ? 'opacity-20' : 'opacity-50'
          }`}
        ></div>

        {/* 圣诞老人图片 */}
        <img 
          // 替换为更稳定的图源：圣诞老人正在阅读清单
          src="./assets/santa.webp" 
          alt="Santa Reading List" 
          className={`relative z-10 w-full h-auto drop-shadow-2xl transition-all duration-1000 hover:scale-105 ${
            isNightMode ? 'brightness-75 contrast-125' : 'brightness-100'
          }`}
          style={{
            transform: 'scale(.5)'
          }}
        />

        {/* 魔法微尘动画 */}
        <div className="absolute inset-0 z-20 overflow-hidden">
           <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-[#ffd700] rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
           <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#fff] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
           <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-[#ffd700] rounded-full animate-bounce" style={{ animationDuration: '4s' }}></div>
        </div>

        {/* 标语 */}
        <div 
          className={`absolute -left-10 md:-left-20 top-1/3 transform -rotate-6 font-handwriting text-xl md:text-2xl opacity-0 animate-fade-in-delayed transition-colors duration-1000 ${
            isNightMode ? 'text-[#a0a0ff] drop-shadow-[0_0_5px_rgba(0,0,0,0.8)]' : 'text-[#2a0a0a] drop-shadow-[0_0_2px_rgba(255,215,0,0.8)]'
          }`}
          style={{ animationDelay: '2s', animationFillMode: 'forwards' }}
        >
          <span className="bg-[#fff]/90 px-3 py-1 rounded-tl-xl rounded-br-xl shadow-lg border border-[#b38728]/30">
            Checking the list... 
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-delayed {
          0% { opacity: 0; transform: translateY(20px) rotate(-6deg); }
          100% { opacity: 1; transform: translateY(0) rotate(-6deg); }
        }
        .animate-fade-in-delayed {
          animation: fade-in-delayed 1s ease-out forwards;
        }
        .font-handwriting {
          font-family: 'Dancing Script', cursive, serif;
        }
      `}</style>
    </div>
  );
};

export default FooterSanta;

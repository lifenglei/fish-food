import React, { useState, useEffect } from 'react';

const Countdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const currentYear = new Date().getFullYear();
      let targetDate = new Date(`December 25, ${currentYear} 00:00:00`);
      
      if (new Date().getTime() > targetDate.getTime()) {
        targetDate = new Date(`December 25, ${currentYear + 1} 00:00:00`);
      }

      const difference = targetDate.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const renderUnit = (value: number, label: string) => (
    <div className="flex items-baseline mx-2 group">
      <div className="font-brand text-sm md:text-base text-[#ffd700] tracking-widest drop-shadow-[0_0_5px_rgba(255,215,0,0.3)]">
        {String(value).padStart(2, '0')}
      </div>
      <div className="ml-1 text-[8px] font-serif text-[#d4af37] tracking-wider uppercase opacity-60">
        {label.charAt(0)}
      </div>
    </div>
  );

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
      <div className="bg-[#1a0505]/40 backdrop-blur-md border border-[#b38728]/20 rounded-full px-6 py-1.5 flex items-center justify-center shadow-lg hover:bg-[#1a0505]/60 transition-colors duration-300">
        {/* 左侧装饰点 */}
        <div className="w-1 h-1 bg-[#ffd700] rounded-full mr-4 opacity-50 shadow-[0_0_5px_#ffd700]"></div>

        <div className="flex items-center">
          {renderUnit(timeLeft.days, 'Days')}
          <div className="text-xs text-[#b38728]/30 mx-1">:</div>
          {renderUnit(timeLeft.hours, 'Hours')}
          <div className="text-xs text-[#b38728]/30 mx-1">:</div>
          {renderUnit(timeLeft.minutes, 'Mins')}
          <div className="text-xs text-[#b38728]/30 mx-1">:</div>
          {renderUnit(timeLeft.seconds, 'Secs')}
        </div>

        {/* 右侧装饰点 */}
        <div className="w-1 h-1 bg-[#ffd700] rounded-full ml-4 opacity-50 shadow-[0_0_5px_#ffd700]"></div>
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out 0.2s forwards;
        }
      `}</style>
    </div>
  );
};

export default Countdown;

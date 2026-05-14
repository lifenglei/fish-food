import React from 'react';

interface AmbientBackgroundProps {
  isNightMode?: boolean;
}

const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ isNightMode = false }) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-colors duration-700">
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isNightMode
            ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_80%_25%,rgba(52,211,153,0.05),transparent_24%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.08),transparent_35%),linear-gradient(to_bottom,rgba(2,6,23,0.08),rgba(2,6,23,0.3))]'
            : 'bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,0.12),transparent_26%),radial-gradient(circle_at_80%_25%,rgba(110,231,183,0.08),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(186,230,253,0.1),transparent_34%),linear-gradient(to_bottom,rgba(240,249,255,0.08),rgba(236,253,245,0.18))]'
        }`}
      />

      <div
        className={`absolute -top-24 left-[-10%] h-[42vw] w-[42vw] rounded-full blur-[120px] transition-opacity duration-700 ${
          isNightMode ? 'bg-cyan-400/5' : 'bg-sky-300/12'
        }`}
      />

      <div
        className={`absolute top-[18%] right-[-12%] h-[34vw] w-[34vw] rounded-full blur-[110px] transition-opacity duration-700 ${
          isNightMode ? 'bg-emerald-400/4' : 'bg-emerald-200/12'
        }`}
      />

      <div
        className={`absolute bottom-[-12%] left-[18%] h-[36vw] w-[36vw] rounded-full blur-[130px] transition-opacity duration-700 ${
          isNightMode ? 'bg-sky-400/5' : 'bg-white/12'
        }`}
      />

      <div
        className={`absolute left-1/2 top-[62%] h-28 w-[68vw] -translate-x-1/2 rounded-full blur-3xl transition-opacity duration-700 ${
          isNightMode ? 'bg-cyan-400/4' : 'bg-sky-200/10'
        }`}
      />
    </div>
  );
};

export default AmbientBackground;

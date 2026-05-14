import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import musicFile from '../assets/chris.mp3';

export interface BackgroundMusicRef {
  start: () => void;
}

const BackgroundMusic = forwardRef<BackgroundMusicRef>((props, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化音频（不自动播放）
  useEffect(() => {
    audioRef.current = new Audio(musicFile);
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5; // 设置音量，避免太大声

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 暴露 start 方法给父组件
  useImperativeHandle(ref, () => ({
    start: () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Failed to play music:", error);
          });
      }
    }
  }));

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发全局点击监听
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={togglePlay}
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/80 backdrop-blur border border-slate-600 flex items-center justify-center shadow-lg transition-all hover:scale-110 hover:border-red-400 group ${
          isPlaying ? 'animate-spin-slow' : ''
        }`}
        title={isPlaying ? "暂停音乐" : "播放音乐"}
      >
        {isPlaying ? (
          // 音乐符号图标
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        ) : (
          // 静音/停止图标
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.34 2.93L2.93 4.34 7.29 8.7 7 9H3v6h4l5 5v-6.98l7 7V21h-2v-2.12l2.36 2.36 1.41-1.41L4.34 2.93zM10 15.17L7.83 13H5v-2h2.83l2.17 2.17v2zM12 4L8.27 7.73 12 11.46V4zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>
          </svg>
        )}
      </button>
      
      {/* 添加一个旋转动画的 style */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
});

BackgroundMusic.displayName = 'BackgroundMusic';

export default BackgroundMusic;


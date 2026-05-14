
import React, { useState, useRef, useEffect } from 'react';
import { HATS, FRAMES, INITIAL_TRANSFORM } from '../constants';
import { EditorState } from '../types';

interface AvatarEditorProps {
  editorState: EditorState;
  onUpdateState: (newState: Partial<EditorState>) => void;
  onDownload: (dataUrl: string) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
}

type InteractionMode = 'IDLE' | 'DRAG' | 'RESIZE' | 'ROTATE';

const AvatarEditor: React.FC<AvatarEditorProps> = ({ 
  editorState, 
  onUpdateState, 
  onDownload,
  onInteractionChange 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('IDLE');
  const [showControls, setShowControls] = useState(true);

  // Refs for interaction math
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const startTransformRef = useRef<{
    x: number; 
    y: number; 
    scale: number; 
    rotation: number;
    startDist?: number; // Distance from center for scaling
    startAngle?: number; // Angle for rotation
  } | null>(null);

  const selectedHat = HATS.find(h => h.id === editorState.selectedHatId);
  const selectedFrame = FRAMES.find(f => f.id === editorState.selectedFrameId);

  // Show controls whenever a new hat is selected
  useEffect(() => {
    if (editorState.selectedHatId) {
      setShowControls(true);
    }
  }, [editorState.selectedHatId]);

  // Notify parent component about interaction state (to disable tilt)
  useEffect(() => {
    onInteractionChange?.(interactionMode !== 'IDLE');
  }, [interactionMode, onInteractionChange]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImgSize({ width: naturalWidth, height: naturalHeight });
  };

  // --- Interaction Logic Helpers ---

  const getClientPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX, y: clientY };
  };

  const getContainerCenter = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    // Calculate center based on percentages
    const centerX = rect.left + rect.width * (editorState.hatTransform.x / 100);
    const centerY = rect.top + rect.height * (editorState.hatTransform.y / 100);
    return { x: centerX, y: centerY };
  };

  // --- Event Handlers ---

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!selectedHat) return;
    e.stopPropagation();
    // Start drag and ensure controls are visible
    setShowControls(true);

    if (e.cancelable) e.preventDefault(); 

    const { x, y } = getClientPos(e);

    setInteractionMode('DRAG');
    dragStartRef.current = { x, y };
    startTransformRef.current = { ...editorState.hatTransform };
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); 
    setShowControls(true);
    
    const { x, y } = getClientPos(e);
    const center = getContainerCenter();
    const dist = Math.hypot(x - center.x, y - center.y);

    setInteractionMode('RESIZE');
    dragStartRef.current = { x, y };
    startTransformRef.current = { 
      ...editorState.hatTransform,
      startDist: dist
    };
  };

  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowControls(true);

    const { x, y } = getClientPos(e);
    const center = getContainerCenter();
    // Calculate angle in radians
    const angle = Math.atan2(y - center.y, x - center.x);

    setInteractionMode('ROTATE');
    dragStartRef.current = { x, y };
    startTransformRef.current = {
      ...editorState.hatTransform,
      startAngle: angle
    };
  };

  const handleDelete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onUpdateState({ selectedHatId: null }); // Deselect/Remove
  };

  const handleBackgroundClick = () => {
    // Hide controls to preview the result
    setShowControls(false);
  };

  // --- Global Move/Up Listeners ---

  useEffect(() => {
    if (interactionMode === 'IDLE') return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!dragStartRef.current || !startTransformRef.current || !containerRef.current) return;

      const { x: clientX, y: clientY } = getClientPos(e);

      if (interactionMode === 'DRAG') {
        const deltaXPx = clientX - dragStartRef.current.x;
        const deltaYPx = clientY - dragStartRef.current.y;

        const { width, height } = containerRef.current.getBoundingClientRect();

        // Convert pixel delta to percentage delta
        const deltaXPct = (deltaXPx / width) * 100;
        const deltaYPct = (deltaYPx / height) * 100;

        onUpdateState({
          hatTransform: {
            ...editorState.hatTransform, // Maintain current props not being edited
            x: startTransformRef.current.x + deltaXPct,
            y: startTransformRef.current.y + deltaYPct
          }
        });
      } 
      else if (interactionMode === 'RESIZE') {
        const center = getContainerCenter();
        const currentDist = Math.hypot(clientX - center.x, clientY - center.y);
        const startDist = startTransformRef.current.startDist || 1;
        const startScale = startTransformRef.current.scale;

        // New scale is proportional to distance change
        // We limit min/max scale for sanity
        const newScale = Math.max(0.1, Math.min(5, startScale * (currentDist / startDist)));

        onUpdateState({
          hatTransform: {
            ...editorState.hatTransform,
            scale: Number(newScale.toFixed(2))
          }
        });
      }
      else if (interactionMode === 'ROTATE') {
        const center = getContainerCenter();
        const currentAngle = Math.atan2(clientY - center.y, clientX - center.x);
        const startAngle = startTransformRef.current.startAngle || 0;
        const startRotation = startTransformRef.current.rotation;

        // Calculate rotation difference in degrees
        const deltaAngleDeg = (currentAngle - startAngle) * (180 / Math.PI);

        onUpdateState({
          hatTransform: {
            ...editorState.hatTransform,
            rotation: startRotation + deltaAngleDeg
          }
        });
      }
    };

    const handleUp = () => {
      setInteractionMode('IDLE');
      dragStartRef.current = null;
      startTransformRef.current = null;
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [interactionMode, editorState.hatTransform, onUpdateState]);

  const generateFinalImage = async () => {
    if (!editorState.imageSrc) return;
    setIsProcessing(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const userImg = new Image();
    
    // Helper to load image
    const loadImg = (img: HTMLImageElement, src: string) => {
      return new Promise<void>((resolve, reject) => {
        img.crossOrigin = "anonymous";
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      await loadImg(userImg, editorState.imageSrc);

      canvas.width = userImg.naturalWidth;
      canvas.height = userImg.naturalHeight;

      // 1. Draw User Image
      ctx?.drawImage(userImg, 0, 0);

      // 2. Draw Decoration (Hat) if selected
      if (selectedHat && ctx) {
        const hatImg = new Image();
        await loadImg(hatImg, selectedHat.src);

        const x = (editorState.hatTransform.x / 100) * canvas.width;
        const y = (editorState.hatTransform.y / 100) * canvas.height;
        
        const baseWidth = canvas.width * 0.4; 
        const aspectRatio = hatImg.naturalWidth / hatImg.naturalHeight;
        const drawWidth = baseWidth * editorState.hatTransform.scale;
        const drawHeight = drawWidth / aspectRatio;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((editorState.hatTransform.rotation * Math.PI) / 180);
        ctx.drawImage(hatImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
      }

      // 3. Draw Frame if selected
      if (selectedFrame && ctx) {
        const frameImg = new Image();
        await loadImg(frameImg, selectedFrame.src);
        // Draw frame to cover the entire canvas
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
      }

      onDownload(canvas.toDataURL('image/png'));

    } catch (err) {
      console.error("Failed to generate image", err);
      alert("生成图片失败，请重试");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!editorState.imageSrc) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 backdrop-blur-sm text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg">请先在左侧上传您的头像</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* 3D / Preview Area */}
      <div className="relative w-full aspect-square max-w-md mx-auto bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-4 border-slate-700/50 group select-none">
         {/* Background pattern */}
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

        <div 
          className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-default" 
          ref={containerRef}
          onMouseDown={handleBackgroundClick}
          onTouchStart={handleBackgroundClick}
        >
          {/* Base User Image */}
          <img 
            src={editorState.imageSrc} 
            alt="User Upload" 
            onLoad={onImageLoad}
            className="object-contain max-w-full max-h-full pointer-events-none select-none relative z-0"
          />

          {/* Frame Overlay (Fixed z-index, non-interactive usually) */}
          {selectedFrame && (
             <div className="absolute inset-0 pointer-events-none z-20">
               <img 
                  src={selectedFrame.src} 
                  alt="Frame" 
                  className="w-full h-full object-fill"
               />
             </div>
          )}

          {/* Decoration / Hat (Interactive, z-10) */}
          {selectedHat && (
            <div
              className={`absolute group-editor z-10`}
              style={{
                left: `${editorState.hatTransform.x}%`,
                top: `${editorState.hatTransform.y}%`,
                width: '40%', // Base visual width reference
                transform: `
                  translate(-50%, -50%)
                  rotate(${editorState.hatTransform.rotation}deg)
                  scale(${editorState.hatTransform.scale})
                `,
                touchAction: 'none'
              }}
            >
              {/* Interaction Wrapper */}
              <div className="relative w-full h-full">
                
                {/* The Hat Image */}
                <img 
                  src={selectedHat.src} 
                  alt="Hat" 
                  className="w-full h-auto select-none drop-shadow-xl block cursor-move" 
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                />
                
                {/* Overlay Controls (Bounding Box & Handles) */}
                <div 
                  className={`absolute -inset-2 border-2 border-dashed border-white/80 transition-opacity duration-200 cursor-move
                    ${!showControls ? 'opacity-0 pointer-events-none' : ''}
                    ${showControls && interactionMode !== 'IDLE' ? 'opacity-100' : ''}
                    ${showControls && interactionMode === 'IDLE' ? 'opacity-60 hover:opacity-100' : ''}
                  `}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                >
                    {/* Delete Button (Top-Left) */}
                    <div 
                      className="absolute -top-3 -left-3 w-6 h-6 bg-red-500 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-red-600 z-10 border border-white"
                      onClick={handleDelete}
                      onMouseDown={(e) => e.stopPropagation()} 
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-white">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </div>

                    {/* Rotate Handle (Top-Right) */}
                    <div 
                      className="absolute -top-3 -right-3 w-6 h-6 bg-blue-500 rounded-full shadow-md flex items-center justify-center cursor-alias hover:bg-blue-600 z-10 border border-white"
                      onMouseDown={handleRotateStart}
                      onTouchStart={handleRotateStart}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-white">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>

                    {/* Resize Handle (Bottom-Right) */}
                    <div 
                      className="absolute -bottom-3 -right-3 w-6 h-6 bg-green-500 rounded-full shadow-md flex items-center justify-center cursor-nwse-resize hover:bg-green-600 z-10 border border-white"
                      onMouseDown={handleResizeStart}
                      onTouchStart={handleResizeStart}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3 h-3 text-white transform rotate-90">
                         <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simplified Footer / Action Bar */}
      <div className="flex justify-center">
        <button 
          onClick={generateFinalImage}
          disabled={isProcessing}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            isProcessing 
            ? 'bg-slate-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white transform hover:scale-[1.02]'
          }`}
        >
          {isProcessing ? '生成中...' : '下载圣诞头像'}
        </button>
      </div>
    </div>
  );
};

export default AvatarEditor;

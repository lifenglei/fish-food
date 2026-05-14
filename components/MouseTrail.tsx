import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  life: number;
  color: string;
}

const MouseTrail: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 鼠标移动处理
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      
      // 根据鼠标移动距离生成粒子（移动越快粒子越多）
      const dist = Math.hypot(mouse.current.x - lastMouse.current.x, mouse.current.y - lastMouse.current.y);
      const particleCount = Math.min(5, Math.floor(dist / 5)); // 限制每次生成的最大数量
      
      for (let i = 0; i < particleCount; i++) {
        createParticle(mouse.current.x, mouse.current.y);
      }
      
      lastMouse.current = { ...mouse.current };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 创建粒子
    const createParticle = (x: number, y: number) => {
      const colors = ['#bf953f', '#fcf6ba', '#b38728', '#ffffff'];
      particles.current.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        size: Math.random() * 2 + 0.5, // 粒子大小
        speedX: (Math.random() - 0.5) * 1,
        speedY: (Math.random() - 0.5) * 1 + 0.5, // 微微下落
        life: 1, // 生命值 1.0 -> 0
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    };

    // 动画循环
    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.current.length; i++) {
        const p = particles.current[i];
        
        // 更新
        p.life -= 0.02; // 减少生命值
        p.x += p.speedX;
        p.y += p.speedY;
        p.size *= 0.95; // 逐渐变小

        // 绘制
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // 移除死亡粒子
        if (p.life <= 0) {
          particles.current.splice(i, 1);
          i--;
        }
      }
      
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default MouseTrail;


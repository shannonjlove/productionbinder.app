import { useEffect, useRef } from 'react';

export function AnimatedGradientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      time += 0.002;

      const width = canvas.width;
      const height = canvas.height;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);

      // Animated color stops - warm cream/beige at top, blue in middle, pink/magenta at bottom
      const offset1 = 0.5 + Math.sin(time) * 0.1;
      const offset2 = 0.7 + Math.cos(time * 0.8) * 0.1;

      gradient.addColorStop(0, 'hsl(40, 30%, 95%)'); // Warm cream
      gradient.addColorStop(0.2, 'hsl(45, 25%, 92%)'); // Light beige
      gradient.addColorStop(offset1, 'hsl(210, 60%, 80%)'); // Soft blue
      gradient.addColorStop(offset2, 'hsl(280, 50%, 75%)'); // Light purple
      gradient.addColorStop(1, 'hsl(330, 70%, 70%)'); // Pink/magenta

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Add subtle noise texture
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 8;
        data[i] = Math.min(255, Math.max(0, data[i] + noise));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
      }
      
      ctx.putImageData(imageData, 0, 0);

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

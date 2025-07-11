'use client';

import React, { useEffect, useRef } from 'react';

interface LightningProps {
  hue?: number;
  xOffset?: number;
  speed?: number;
  intensity?: number;
  size?: number;
}

const Lightning: React.FC<LightningProps> = ({
  hue = 220,
  xOffset = 0,
  speed = 1,
  intensity = 1,
  size = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let animationId: number;
    let time = 0;

    const drawLightning = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Number of lightning bolts based on intensity
      const boltCount = Math.floor(3 * intensity);

      for (let i = 0; i < boltCount; i++) {
        // Random starting position
        const startX = (canvas.width * 0.2) + (Math.random() * canvas.width * 0.6) + xOffset;
        const startY = 0;

        // Create lightning path
        const segments = 8 + Math.floor(Math.random() * 5);
        const segmentHeight = canvas.height / segments;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        let currentX = startX;
        let currentY = startY;

        // Draw jagged lightning path
        for (let j = 0; j < segments; j++) {
          const offsetX = (Math.random() - 0.5) * 100 * size;
          currentX += offsetX;
          currentY += segmentHeight;

          ctx.lineTo(currentX, currentY);

          // Occasional branches
          if (Math.random() < 0.3) {
            const branchX = currentX + (Math.random() - 0.5) * 80 * size;
            const branchY = currentY + segmentHeight * 0.5;
            ctx.moveTo(currentX, currentY);
            ctx.lineTo(branchX, branchY);
            ctx.moveTo(currentX, currentY);
          }
        }

        // Lightning styling
        const alpha = 0.4 + Math.random() * 0.6;
        ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${alpha})`;
        ctx.lineWidth = (1 + Math.random() * 2) * size;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Glow effect
        ctx.shadowBlur = 20 * size;
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.5)`;
        ctx.stroke();
      }

      time += 0.016 * speed;

      // Random flashing effect
      if (Math.random() < 0.02 * speed) {
        ctx.fillStyle = `hsla(${hue}, 100%, 90%, 0.05)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationId = requestAnimationFrame(drawLightning);
    };

    // Start animation with random delay
    setTimeout(() => {
      drawLightning();
    }, Math.random() * 1000);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, [hue, xOffset, speed, intensity, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};

export default Lightning;
'use client';

import React, { useEffect, useRef, useState } from 'react';

interface PlasmaProps {
  color?: string;
  speed?: number;
  direction?: 'forward' | 'reverse';
  scale?: number;
  opacity?: number;
  mouseInteractive?: boolean;
}

const Plasma: React.FC<PlasmaProps> = ({
  color = '#ff6b35',
  speed = 0.6,
  direction = 'forward',
  scale = 1.1,
  opacity = 0.8,
  mouseInteractive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Parse color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 107, b: 53 };
    };

    const rgb = hexToRgb(color);

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Create image data
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      
      // Update time based on speed and direction
      if (direction === 'forward') {
        timeRef.current += speed * 0.01;
      } else {
        timeRef.current -= speed * 0.01;
      }
      
      const time = timeRef.current;
      
      // Mouse influence factor
      const mouseInfluence = mouseInteractive ? 0.0005 : 0;
      
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          const index = (y * width + x) * 4;
          
          // Calculate plasma effect
          const dx = x - width / 2;
          const dy = y - height / 2;
          const distance = Math.sqrt(dx * dx + dy * dy) * scale * 0.01;
          
          // Add mouse interaction
          const mouseDx = mouseInteractive ? (x - mousePos.x * width) : 0;
          const mouseDy = mouseInteractive ? (y - mousePos.y * height) : 0;
          const mouseDistance = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy) * mouseInfluence;
          
          // Plasma calculations with multiple wave functions
          const value1 = Math.sin(distance * 0.05 + time);
          const value2 = Math.sin((x * 0.01 + time) * 2) + Math.cos((y * 0.01 - time) * 2);
          const value3 = Math.sin(Math.sqrt((x - width * 0.5) * (x - width * 0.5) + 
                                           (y - height * 0.5) * (y - height * 0.5)) * 0.01 + time);
          const value4 = Math.sin(mouseDistance + time * 2);
          
          // Combine values
          const plasma = (value1 + value2 + value3 + value4) / 4;
          
          // Map to color
          const intensity = (plasma + 1) * 0.5; // Normalize to 0-1
          
          // Apply color with gradient effect
          data[index] = rgb.r * intensity;     // Red
          data[index + 1] = rgb.g * intensity * 0.8; // Green
          data[index + 2] = rgb.b * intensity * 1.2; // Blue
          data[index + 3] = 255 * opacity;     // Alpha
        }
      }
      
      // Draw to canvas
      ctx.putImageData(imageData, 0, 0);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color, speed, direction, scale, opacity, mouseInteractive, mousePos]);

  useEffect(() => {
    if (!mouseInteractive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseInteractive]);

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

export default Plasma;
'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  droppedFrames: number;
}

export const usePerformanceMonitor = (enableMonitoring = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    droppedFrames: 0
  });
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const droppedFramesRef = useRef(0);
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!enableMonitoring) return;

    let lastFrameTime = performance.now();
    const targetFrameTime = 1000 / 60; // 16.67ms for 60fps

    const measureFrame = (currentTime: DOMHighResTimeStamp) => {
      frameCountRef.current++;
      
      const deltaTime = currentTime - lastFrameTime;
      const currentFrameTime = deltaTime;
      
      // Detect dropped frames
      if (currentFrameTime > targetFrameTime * 1.5) {
        droppedFramesRef.current++;
      }
      
      // Calculate FPS every second
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
        
        setMetrics({
          fps,
          frameTime: 1000 / fps,
          droppedFrames: droppedFramesRef.current
        });
        
        frameCountRef.current = 0;
        droppedFramesRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      lastFrameTime = currentTime;
      animationIdRef.current = requestAnimationFrame(measureFrame);
    };

    animationIdRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [enableMonitoring]);

  return metrics;
};
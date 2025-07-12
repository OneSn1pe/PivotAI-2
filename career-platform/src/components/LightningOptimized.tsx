'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface LightningProps {
  hue?: number;
  xOffset?: number;
  speed?: number;
  intensity?: number;
  size?: number;
  quality?: 'low' | 'medium' | 'high';
  enableOnSafari?: boolean;
}

const Lightning: React.FC<LightningProps> = ({ 
  hue = 230, 
  xOffset = 0, 
  speed = 1, 
  intensity = 1, 
  size = 1,
  quality = 'high',
  enableOnSafari = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isVisible, setIsVisible] = useState(true);
  const [currentQuality, setCurrentQuality] = useState(quality);
  const lastFrameTime = useRef(0);
  const frameCount = useRef(0);
  const fps = useRef(60);

  // Detect Safari
  const isSafari = typeof window !== 'undefined' && 
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Disable on Safari by default
  if (isSafari && !enableOnSafari) {
    return null;
  }

  // Quality-based octave count
  const getOctaveCount = (q: string) => {
    switch (q) {
      case 'low': return 4;
      case 'medium': return 7;
      case 'high': return 10;
      default: return 7;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    });
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
      }
    `;

    // Fragment shader with dynamic octave count
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_xOffset;
      uniform float u_hue;
      uniform float u_speed;
      uniform float u_intensity;
      uniform float u_size;
      
      #define OCTAVE_COUNT ${getOctaveCount(currentQuality)}
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        
        for (int i = 0; i < OCTAVE_COUNT; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        
        return value;
      }
      
      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
      }
      
      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x += u_xOffset;
        
        // Scale
        st *= u_size;
        
        vec2 q = vec2(0.0);
        q.x = fbm(st + u_time * 0.1 * u_speed);
        q.y = fbm(st + vec2(1.0));
        
        vec2 r = vec2(0.0);
        r.x = fbm(st + 4.0 * q + vec2(1.7, 9.2) + 0.15 * u_time * u_speed);
        r.y = fbm(st + 4.0 * q + vec2(8.3, 2.8) + 0.126 * u_time * u_speed);
        
        float f = fbm(st + 4.0 * r);
        
        // Enhanced lightning effect
        f = pow(f, 3.0) * 3.0 * u_intensity;
        
        // Color with hue control
        vec3 color = hsv2rgb(vec3(u_hue / 360.0, 0.7, f * 0.8));
        
        // Add glow
        color += vec3(0.1, 0.1, 0.2) * f * 0.5;
        
        // Fade edges
        float edgeFade = 1.0 - smoothstep(0.0, 0.1, st.x) * smoothstep(0.9, 1.0, st.x);
        color *= edgeFade;
        
        gl_FragColor = vec4(color, f * 0.8);
      }
    `;

    // Create shaders
    function createShader(gl: WebGLRenderingContext, type: number, source: string) {
      const shader = gl.createShader(type);
      if (!shader) return null;
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;

    // Create program
    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }

    // Set up geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]), gl.STATIC_DRAW);

    // Get attribute and uniform locations
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const xOffsetLocation = gl.getUniformLocation(program, 'u_xOffset');
    const hueLocation = gl.getUniformLocation(program, 'u_hue');
    const speedLocation = gl.getUniformLocation(program, 'u_speed');
    const intensityLocation = gl.getUniformLocation(program, 'u_intensity');
    const sizeLocation = gl.getUniformLocation(program, 'u_size');

    // Resize handler with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Use lower resolution for better performance
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const scaleFactor = currentQuality === 'low' ? 0.5 : currentQuality === 'medium' ? 0.75 : 1;
        
        canvas.width = width * pixelRatio * scaleFactor;
        canvas.height = height * pixelRatio * scaleFactor;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        gl.viewport(0, 0, canvas.width, canvas.height);
      }, 100);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Performance monitoring
    const checkPerformance = () => {
      if (frameCount.current % 60 === 0 && frameCount.current > 0) {
        if (fps.current < 30 && currentQuality !== 'low') {
          setCurrentQuality('low');
          console.log('Switching to low quality mode for better performance');
        }
      }
    };

    // Animation loop with frame rate limiting
    let startTime = 0;
    const targetFPS = 30; // Target 30 FPS for better performance
    const frameTime = 1000 / targetFPS;
    let lastTime = 0;

    const render = (currentTime: number) => {
      if (!isVisible) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Frame rate limiting
      const deltaTime = currentTime - lastTime;
      if (deltaTime < frameTime) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Calculate FPS
      frameCount.current++;
      if (currentTime - lastFrameTime.current >= 1000) {
        fps.current = frameCount.current;
        frameCount.current = 0;
        lastFrameTime.current = currentTime;
        checkPerformance();
      }

      if (!startTime) startTime = currentTime;
      const time = (currentTime - startTime) * 0.001;
      
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.useProgram(program);
      
      // Set uniforms
      gl.uniform1f(timeLocation, time);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(xOffsetLocation, xOffset);
      gl.uniform1f(hueLocation, hue);
      gl.uniform1f(speedLocation, speed);
      gl.uniform1f(intensityLocation, intensity);
      gl.uniform1f(sizeLocation, size);
      
      // Bind position buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Draw
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      lastTime = currentTime;
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    animationFrameRef.current = requestAnimationFrame(render);

    // Visibility change handler
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(resizeTimeout);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up WebGL resources
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [hue, xOffset, speed, intensity, size, currentQuality, isVisible, isSafari, enableOnSafari]);

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
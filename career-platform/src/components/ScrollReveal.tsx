'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  baseOpacity?: number;
  enableBlur?: boolean;
  baseRotation?: number;
  blurStrength?: number;
  className?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  baseOpacity = 0,
  enableBlur = true,
  baseRotation = 5,
  blurStrength = 10,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Transform values based on scroll progress
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [baseOpacity, 1, 1, baseOpacity]);
  const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [50, 0, 0, -50]);
  const rotate = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [baseRotation, 0, 0, -baseRotation]);
  const blur = useTransform(
    scrollYProgress, 
    [0, 0.3, 0.7, 1], 
    enableBlur ? [`blur(${blurStrength}px)`, 'blur(0px)', 'blur(0px)', `blur(${blurStrength}px)`] : ['blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(0px)']
  );

  // Split text into words for individual animation
  const content = typeof children === 'string' 
    ? children.split(' ').map((word, index) => (
        <motion.span
          key={index}
          className="inline-block"
          style={{
            opacity,
            y,
            rotate,
            filter: blur,
          }}
          transition={{
            delay: index * 0.02,
          }}
        >
          {word}&nbsp;
        </motion.span>
      ))
    : children;

  return (
    <div ref={ref} className={`${className}`}>
      {typeof children === 'string' ? (
        <span className="inline">{content}</span>
      ) : (
        <motion.div
          style={{
            opacity,
            y,
            rotate,
            filter: blur,
          }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

export default ScrollReveal;
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface RotatingTextProps {
  texts: string[];
  mainClassName?: string;
  staggerFrom?: 'first' | 'last';
  initial?: any;
  animate?: any;
  exit?: any;
  staggerDuration?: number;
  splitLevelClassName?: string;
  transition?: any;
  rotationInterval?: number;
}

const RotatingText: React.FC<RotatingTextProps> = ({
  texts,
  mainClassName = '',
  staggerFrom = 'first',
  initial = { y: '100%' },
  animate = { y: 0 },
  exit = { y: '-120%' },
  staggerDuration = 0.025,
  splitLevelClassName = '',
  transition = { type: 'spring', damping: 30, stiffness: 400 },
  rotationInterval = 2000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [texts.length, rotationInterval]);

  const currentText = texts[currentIndex];
  const letters = currentText.split('');

  return (
    <span className={`inline-flex ${mainClassName}`}>
      <AnimatePresence mode="wait">
        <motion.span key={currentIndex} className="inline-flex">
          {letters.map((letter, index) => {
            const staggerDelay = staggerFrom === 'first' 
              ? index * staggerDuration 
              : (letters.length - 1 - index) * staggerDuration;

            return (
              <span key={index} className={splitLevelClassName}>
                <motion.span
                  className="inline-block"
                  initial={initial}
                  animate={animate}
                  exit={exit}
                  transition={{
                    ...transition,
                    delay: staggerDelay,
                  }}
                >
                  {letter === ' ' ? '\u00A0' : letter}
                </motion.span>
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default RotatingText;
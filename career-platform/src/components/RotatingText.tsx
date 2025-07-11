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
  const words = currentText.split(' ');

  return (
    <span className={`inline-flex ${mainClassName}`}>
      <AnimatePresence mode="wait">
        <motion.span key={currentIndex} className="inline-flex">
          {words.map((word, wordIndex) => {
            const wordLetters = word.split('');
            const isHighlightWord = word === 'CRACKD' || word === 'SMART' || word === 'PREPARED';
            
            return (
              <span key={wordIndex} className="inline-flex">
                {wordLetters.map((letter, letterIndex) => {
                  const globalIndex = words.slice(0, wordIndex).join(' ').length + (wordIndex > 0 ? 1 : 0) + letterIndex;
                  const staggerDelay = staggerFrom === 'first' 
                    ? globalIndex * staggerDuration 
                    : (currentText.length - 1 - globalIndex) * staggerDuration;

                  return (
                    <span key={`${wordIndex}-${letterIndex}`} className={splitLevelClassName}>
                      <motion.span
                        className={`inline-block ${isHighlightWord ? 'bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#2563EB] text-transparent bg-clip-text' : ''}`}
                        initial={initial}
                        animate={animate}
                        exit={exit}
                        transition={{
                          ...transition,
                          delay: staggerDelay,
                        }}
                      >
                        {letter}
                      </motion.span>
                    </span>
                  );
                })}
                {wordIndex < words.length - 1 && (
                  <span className={splitLevelClassName}>
                    <motion.span
                      className="inline-block"
                      initial={initial}
                      animate={animate}
                      exit={exit}
                      transition={{
                        ...transition,
                        delay: staggerFrom === 'first' 
                          ? (words.slice(0, wordIndex + 1).join(' ').length) * staggerDuration
                          : (currentText.length - words.slice(0, wordIndex + 1).join(' ').length) * staggerDuration,
                      }}
                    >
                      {'\u00A0'}
                    </motion.span>
                  </span>
                )}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

export default RotatingText;
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafariOptimization } from '@/hooks/useSafariOptimization';
import RotatingText from '@/components/RotatingText';

interface RotatingTextOptimizedProps {
  texts: string[];
  mainClassName?: string;
  rotationInterval?: number;
}

const RotatingTextOptimized: React.FC<RotatingTextOptimizedProps> = ({
  texts,
  mainClassName = '',
  rotationInterval = 2500
}) => {
  const { isSafari, shouldReduceAnimations } = useSafariOptimization();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (shouldReduceAnimations) {
      // Slower rotation for reduced motion
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
      }, rotationInterval * 2);
      return () => clearInterval(interval);
    }
  }, [texts.length, rotationInterval, shouldReduceAnimations]);

  // Safari optimized version
  if (isSafari || shouldReduceAnimations) {
    return (
      <div className={`${mainClassName} relative inline-block`}>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentIndex}
            className="inline-block will-change-transform"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ transform: 'translateZ(0)' }}
          >
            {texts[currentIndex].split(' ').map((word, wordIndex) => {
              const isSpecialWord = ['CRACKD', 'SMART', 'PREPARED'].includes(word);
              return (
                <span key={wordIndex} className="inline-block mr-2">
                  {isSpecialWord ? (
                    <span className="bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#2563EB] text-transparent bg-clip-text font-bold">
                      {word}
                    </span>
                  ) : (
                    word
                  )}
                </span>
              );
            })}
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  // Use original component for non-Safari browsers
  return (
    <RotatingText
      texts={texts}
      mainClassName={mainClassName}
      rotationInterval={rotationInterval}
      staggerFrom="last"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "-120%" }}
      staggerDuration={0.025}
      splitLevelClassName="overflow-hidden inline-block"
      transition={{ type: "spring", damping: 30, stiffness: 400 }}
    />
  );
};

export default RotatingTextOptimized;
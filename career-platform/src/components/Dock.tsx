'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

interface DockItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  id?: string;
}

interface DockProps {
  items: DockItem[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  className?: string;
  activeItem?: string;
}

const Dock: React.FC<DockProps> = ({
  items,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
  className = '',
  activeItem,
}) => {
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const dockRef = useRef<HTMLDivElement>(null);

  // Calculate total width needed for the dock with extra space for magnification
  const gap = 4; // Reduced gap since we'll have overflow space
  const padding = 24; // total horizontal padding
  const extraSpacePerItem = 20; // Extra space to accommodate magnification
  const minDockWidth = items.length * (baseItemSize + extraSpacePerItem) + (items.length - 1) * gap + padding;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dockRef.current) {
        const rect = dockRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
      }
    };

    const handleMouseLeave = () => {
      mouseX.set(Infinity);
    };

    if (dockRef.current) {
      dockRef.current.addEventListener('mousemove', handleMouseMove);
      dockRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (dockRef.current) {
        dockRef.current.removeEventListener('mousemove', handleMouseMove);
        dockRef.current.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [mouseX]);

  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] ${className}`}>
      <motion.div
        ref={dockRef}
        className="relative px-3 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-visible"
        style={{ 
          height: panelHeight,
          minWidth: minDockWidth,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          y: hovered ? 0 : 10,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className="relative flex items-end justify-center h-full" style={{ gap: `${gap}px` }}>
          {items.map((item, index) => (
            <DockItem
              key={index}
              item={item}
              index={index}
              mouseX={mouseX}
              baseItemSize={baseItemSize}
              magnification={magnification}
              totalItems={items.length}
              isActive={item.id === activeItem}
              gap={gap}
              extraSpace={extraSpacePerItem}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

interface DockItemProps {
  item: DockItem;
  index: number;
  mouseX: MotionValue<number>;
  baseItemSize: number;
  magnification: number;
  totalItems: number;
  isActive?: boolean;
  gap: number;
  extraSpace: number;
}

const DockItem: React.FC<DockItemProps> = ({
  item,
  index,
  mouseX,
  baseItemSize,
  magnification,
  totalItems,
  isActive = false,
  gap,
  extraSpace,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showLabel, setShowLabel] = useState(false);

  // Calculate item position based on index with extra space
  const itemWidth = baseItemSize + extraSpace;
  const itemPosition = index * (itemWidth + gap) + itemWidth / 2 + 12; // 12px for left padding

  const distance = useTransform(mouseX, (val: number) => {
    return Math.abs(val - itemPosition);
  });

  // Adjusted scale for better control
  const maxScale = magnification / baseItemSize;
  const scale = useTransform(
    distance, 
    [0, 60, 120], 
    [maxScale, 1.1, 1]
  );
  
  const size = useSpring(useTransform(scale, (s) => s * baseItemSize), {
    stiffness: 400,
    damping: 30,
  });

  // Calculate z-index based on scale to ensure hovered items appear on top
  const zIndex = useTransform(scale, (s) => Math.round(s * 100));

  return (
    <motion.div 
      ref={ref}
      className="relative flex items-center justify-center"
      style={{ 
        width: itemWidth,
        height: baseItemSize,
        zIndex,
      }}
    >
      <motion.button
        className={`absolute flex items-center justify-center rounded-xl transition-colors cursor-pointer backdrop-blur-sm border ${
          isActive 
            ? 'bg-white/40 border-white/30' 
            : 'bg-white/20 hover:bg-white/30 border-white/10'
        }`}
        style={{
          width: size,
          height: size,
          // Ensure button doesn't exceed container bounds
          maxWidth: magnification,
          maxHeight: magnification,
        }}
        onClick={item.onClick}
        onMouseEnter={() => setShowLabel(true)}
        onMouseLeave={() => setShowLabel(false)}
        whileTap={{ scale: 0.95 }}
      >
        {/* Label tooltip */}
        <motion.div
          className="absolute px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none z-50"
          style={{
            bottom: '100%',
            marginBottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: showLabel ? 1 : 0, y: showLabel ? 0 : 10 }}
          transition={{ duration: 0.2 }}
        >
          {item.label}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900" />
          </div>
        </motion.div>

        <motion.div
          className={`${isActive ? 'text-white' : 'text-white/90'}`}
          style={{
            scale: useTransform(scale, (s) => Math.min(1, s * 0.7)),
          }}
        >
          {item.icon}
        </motion.div>
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-[#38BDF8]/20 to-transparent rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.button>
    </motion.div>
  );
};

export default Dock;
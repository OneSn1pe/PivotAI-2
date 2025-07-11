'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface DockItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface DockProps {
  items: DockItem[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  className?: string;
}

const Dock: React.FC<DockProps> = ({
  items,
  panelHeight = 68,
  baseItemSize = 50,
  magnification = 70,
  className = '',
}) => {
  const [hovered, setHovered] = useState(false);
  const mouseX = useMotionValue(Infinity);
  const dockRef = useRef<HTMLDivElement>(null);

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
        className="flex items-end gap-2 px-3 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl"
        style={{ height: panelHeight }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          y: hovered ? 0 : 10,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {items.map((item, index) => (
          <DockItem
            key={index}
            item={item}
            index={index}
            mouseX={mouseX}
            baseItemSize={baseItemSize}
            magnification={magnification}
            totalItems={items.length}
          />
        ))}
      </motion.div>
    </div>
  );
};

interface DockItemProps {
  item: DockItem;
  index: number;
  mouseX: any;
  baseItemSize: number;
  magnification: number;
  totalItems: number;
}

const DockItem: React.FC<DockItemProps> = ({
  item,
  index,
  mouseX,
  baseItemSize,
  magnification,
  totalItems,
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [showLabel, setShowLabel] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2 - ref.current.offsetParent!.getBoundingClientRect().left;
      return Math.abs(val - itemCenter);
    }
    return Infinity;
  });

  const scale = useTransform(distance, [0, 100, 200], [magnification / baseItemSize, 1.2, 1]);
  const size = useSpring(useTransform(scale, (s) => s * baseItemSize), {
    stiffness: 400,
    damping: 30,
  });

  return (
    <div className="relative">
      {/* Label tooltip */}
      <motion.div
        className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap pointer-events-none"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: showLabel ? 1 : 0, y: showLabel ? 0 : 10 }}
        transition={{ duration: 0.2 }}
      >
        {item.label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
          <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900" />
        </div>
      </motion.div>

      <motion.button
        ref={ref}
        className="relative flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl transition-colors cursor-pointer backdrop-blur-sm border border-white/10"
        style={{
          width: size,
          height: size,
        }}
        onClick={item.onClick}
        onMouseEnter={() => setShowLabel(true)}
        onMouseLeave={() => setShowLabel(false)}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          className="text-white"
          style={{
            scale: useTransform(scale, (s) => Math.min(1.2, s * 0.8)),
          }}
        >
          {item.icon}
        </motion.div>
      </motion.button>
    </div>
  );
};

export default Dock;
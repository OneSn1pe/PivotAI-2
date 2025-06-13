'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoadingComplete?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  fill = false,
  sizes,
  quality = 75,
  placeholder,
  blurDataURL,
  onLoadingComplete
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for viewport detection
  useEffect(() => {
    if (priority || !imageRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Image is in viewport, Next.js Image will handle loading
            observer.disconnect();
          }
        });
      },
      { 
        threshold: 0,
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imageRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    onLoadingComplete?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Optimized sizes for responsive images
  const optimizedSizes = sizes || (fill 
    ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
    : undefined
  );

  return (
    <div 
      ref={imageRef}
      className={cn(
        "relative overflow-hidden bg-gray-100",
        fill && "h-full w-full",
        className
      )}
    >
      {/* Loading skeleton with fade animation */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 animate-in fade-in duration-200">
          <Skeleton className="h-full w-full" />
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-gray-500">Failed to load image</p>
          </div>
        </div>
      )}
      
      {/* Optimized Next.js Image */}
      {!hasError && (
        <Image
          src={src}
          alt={alt}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          fill={fill}
          sizes={optimizedSizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoadingComplete}
          onError={handleError}
          className={cn(
            "object-cover transition-all duration-500",
            isLoading ? "opacity-0 scale-105" : "opacity-100 scale-100",
            className
          )}
        />
      )}
    </div>
  );
}
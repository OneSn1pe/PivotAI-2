// Font loading optimization utility
export const optimizeFontLoading = () => {
  if (typeof window === 'undefined') return;

  // Use Font Face Observer pattern for critical fonts
  const fontLoadPromises: Promise<void>[] = [];

  // Check if fonts API is available
  if ('fonts' in document) {
    // Wait for all fonts to load
    fontLoadPromises.push(
      document.fonts.ready.then(() => {
        document.documentElement.classList.add('fonts-loaded');
      })
    );
  } else {
    // Fallback for older browsers
    const fontCheckInterval = setInterval(() => {
      // Check if Inter font is loaded by measuring text
      const testEl = document.createElement('span');
      testEl.style.cssText = 'position:absolute;top:-9999px;left:-9999px;font-size:100px;font-family:Inter,sans-serif;';
      testEl.textContent = 'giItT1WQy@!-/#';
      document.body.appendChild(testEl);

      const fallbackWidth = testEl.offsetWidth;
      testEl.style.fontFamily = 'sans-serif';
      const defaultWidth = testEl.offsetWidth;

      document.body.removeChild(testEl);

      if (fallbackWidth !== defaultWidth) {
        clearInterval(fontCheckInterval);
        document.documentElement.classList.add('fonts-loaded');
      }
    }, 50);

    // Clear interval after 3 seconds to prevent infinite checking
    setTimeout(() => clearInterval(fontCheckInterval), 3000);
  }

  return Promise.all(fontLoadPromises);
};

// Preload critical fonts
export const preloadFonts = () => {
  const fontUrls = [
    '/fonts/inter-var.woff2',
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
  ];

  fontUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Initialize font optimization
export const initFontOptimization = () => {
  if (typeof window !== 'undefined') {
    // Preload fonts as early as possible
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', preloadFonts);
    } else {
      preloadFonts();
    }

    // Optimize font loading
    optimizeFontLoading();
  }
};
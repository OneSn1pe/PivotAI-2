'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Monitor when the page is fully loaded
    const handleLoad = () => {
      // Add a small delay to ensure CSS is fully applied
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    };

    // Check if already loaded
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    // Also monitor for DOMContentLoaded as a fallback
    const handleDOMReady = () => {
      // Check if all stylesheets are loaded
      const stylesheets = Array.from(document.styleSheets);
      const allLoaded = stylesheets.every(sheet => {
        try {
          return sheet.cssRules !== null;
        } catch {
          // External stylesheets might throw security errors
          return true;
        }
      });

      if (allLoaded && document.readyState === 'complete') {
        handleLoad();
      }
    };

    if (document.readyState !== 'loading') {
      handleDOMReady();
    } else {
      document.addEventListener('DOMContentLoaded', handleDOMReady);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      document.removeEventListener('DOMContentLoaded', handleDOMReady);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      id="loading-screen"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        zIndex: 99999,
        transition: 'opacity 0.3s ease-out',
        opacity: isLoading ? 1 : 0,
      }}
    >
      <div
        style={{
          textAlign: 'center',
        }}
      >
        {/* Logo or brand name */}
        <div
          style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '2rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Career Platform
        </div>

        {/* Loading spinner */}
        <div
          style={{
            width: '48px',
            height: '48px',
            margin: '0 auto',
            border: '3px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />

        {/* Loading text */}
        <div
          style={{
            marginTop: '1.5rem',
            fontSize: '1rem',
            color: '#6b7280',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Loading...
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `,
        }}
      />
    </div>
  );
}
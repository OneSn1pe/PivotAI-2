'use client';

import { useEffect, useState } from 'react';

export function CSSLoader({ children }: { children: React.ReactNode }) {
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    // Check if Tailwind CSS is loaded by testing a known class
    const checkCSS = () => {
      const testElement = document.createElement('div');
      testElement.className = 'bg-gray-50';
      document.body.appendChild(testElement);
      
      const computedStyle = window.getComputedStyle(testElement);
      const bgColor = computedStyle.backgroundColor;
      
      document.body.removeChild(testElement);
      
      // Check if the background color matches Tailwind's gray-50 (rgb(250, 250, 250))
      if (bgColor === 'rgb(250, 250, 250)') {
        setCssLoaded(true);
      } else {
        // If not loaded, check again in 50ms
        setTimeout(checkCSS, 50);
      }
    };

    checkCSS();
  }, []);

  // Show a minimal loading state while CSS is loading
  if (!cssLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'rgb(250, 250, 250)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
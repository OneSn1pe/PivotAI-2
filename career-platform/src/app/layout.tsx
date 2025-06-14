import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "PivotAI - Career Development Platform",
  description: "Your professional journey for career growth and development",
  icons: {
    icon: [
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon/favicon.ico',
    other: [
      {
        rel: 'manifest',
        url: '/favicon/site.webmanifest',
      },
      {
        rel: 'android-chrome',
        url: '/favicon/android-chrome-192x192.png',
        sizes: '192x192',
      },
      {
        rel: 'android-chrome',
        url: '/favicon/android-chrome-512x512.png',
        sizes: '512x512',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Critical inline CSS to prevent FOUC and ensure immediate styling */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Hide main content initially */
              #main-content {
                visibility: hidden;
                opacity: 0;
              }
              #main-content.loaded {
                visibility: visible;
                opacity: 1;
                transition: opacity 0.3s ease-in;
              }
              
              /* Initial loading screen styles */
              #initial-loading {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: #f9fafb;
                z-index: 99999;
              }
              #initial-loading.hide {
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease-out;
              }
              
              /* Critical styles for layout stability */
              * {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: ${inter.style.fontFamily}, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background-color: #f9fafb;
                color: #111827;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              
              /* Spinner animation */
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              .spinner {
                width: 48px;
                height: 48px;
                border: 3px solid #e5e7eb;
                border-top-color: #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
              }
              
              /* Prevent layout shift from scrollbar */
              html {
                overflow-y: scroll;
              }
              
              /* Critical typography to prevent FOUT */
              h1, h2, h3, h4, h5, h6 {
                margin: 0;
                font-weight: 600;
                line-height: 1.25;
              }
              p {
                margin: 0;
                line-height: 1.5;
              }
              
              /* Prevent image layout shifts */
              img {
                max-width: 100%;
                height: auto;
              }
            `,
          }}
        />
        
        {/* Preload critical resources */}
        <link 
          rel="preload" 
          href="/_next/static/css/app/layout.css" 
          as="style"
        />
        <link 
          rel="stylesheet" 
          href="/_next/static/css/app/layout.css" 
        />
        
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://securetoken.googleapis.com" />
        
        {/* DNS prefetch for additional resources */}
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebaseapp.com" />
        <link rel="dns-prefetch" href="https://www.gstatic.com" />
        
        {/* Resource hints for better performance */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f9fafb" />
      </head>
      <body className={`${inter.className} bg-gray-50 antialiased`}>
        {/* Initial loading screen - rendered immediately with inline styles */}
        <div id="initial-loading">
          <div style={{ textAlign: 'center' }}>
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
            <div className="spinner" />
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
        </div>
        
        {/* Main content - hidden initially */}
        <div id="main-content">
          <Providers>
            {children}
          </Providers>
        </div>
        
        
        {/* Enhanced loading script with multiple checks */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var loadingScreen = document.getElementById('initial-loading');
                var mainContent = document.getElementById('main-content');
                var checkInterval;
                var startTime = Date.now();
                var minLoadTime = 500; // Minimum time to show loading screen
                var maxWaitTime = 3000; // Maximum wait time
                var cssLoaded = false;
                var fontsLoaded = false;
                var domReady = false;
                
                // Check if CSS is loaded
                function checkCSSLoaded() {
                  var sheets = document.styleSheets;
                  if (sheets.length === 0) return false;
                  
                  try {
                    // Check if we can access CSS rules (indicates CSS is loaded)
                    for (var i = 0; i < sheets.length; i++) {
                      if (sheets[i].href && sheets[i].href.includes('_next/static/css')) {
                        try {
                          // Try to access cssRules - will throw if not loaded
                          var rules = sheets[i].cssRules || sheets[i].rules;
                          if (rules && rules.length > 0) {
                            return true;
                          }
                        } catch (e) {
                          // External CSS not yet loaded
                          return false;
                        }
                      }
                    }
                  } catch (e) {
                    // Some browsers may throw on styleSheets access
                  }
                  
                  // Fallback: check if computed styles are applied
                  var testEl = document.createElement('div');
                  testEl.className = 'bg-gray-50';
                  document.body.appendChild(testEl);
                  var computed = window.getComputedStyle(testEl);
                  var hasStyles = computed.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                                 computed.backgroundColor !== 'transparent';
                  document.body.removeChild(testEl);
                  
                  return hasStyles;
                }
                
                // Check if fonts are loaded
                function checkFontsLoaded() {
                  if ('fonts' in document) {
                    return document.fonts.ready.then(function() {
                      fontsLoaded = true;
                      return true;
                    });
                  }
                  // Fallback for browsers without font loading API
                  return true;
                }
                
                // Hide loading screen
                function hideLoading() {
                  var elapsed = Date.now() - startTime;
                  var delay = Math.max(0, minLoadTime - elapsed);
                  
                  setTimeout(function() {
                    loadingScreen.classList.add('hide');
                    mainContent.classList.add('loaded');
                    setTimeout(function() {
                      loadingScreen.style.display = 'none';
                    }, 300);
                  }, delay);
                }
                
                // Main check function
                function checkReady() {
                  // Check DOM ready
                  if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    domReady = true;
                  }
                  
                  // Check CSS loaded
                  if (!cssLoaded) {
                    cssLoaded = checkCSSLoaded();
                  }
                  
                  // Check if all conditions are met
                  if (domReady && cssLoaded) {
                    clearInterval(checkInterval);
                    
                    // Wait for fonts if supported
                    if ('fonts' in document) {
                      document.fonts.ready.then(function() {
                        hideLoading();
                      });
                    } else {
                      hideLoading();
                    }
                  }
                  
                  // Fallback: hide after max wait time
                  if (Date.now() - startTime > maxWaitTime) {
                    clearInterval(checkInterval);
                    hideLoading();
                  }
                }
                
                // Start checking immediately
                checkInterval = setInterval(checkReady, 50);
                
                // Also listen for specific events
                window.addEventListener('load', function() {
                  cssLoaded = true;
                  domReady = true;
                  clearInterval(checkInterval);
                  hideLoading();
                });
                
                document.addEventListener('DOMContentLoaded', function() {
                  domReady = true;
                });
                
                // Check fonts
                if ('fonts' in document) {
                  document.fonts.ready.then(function() {
                    fontsLoaded = true;
                  });
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
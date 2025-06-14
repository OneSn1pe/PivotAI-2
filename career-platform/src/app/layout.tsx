import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/providers";
import { LoadingScreen } from "@/components/LoadingScreen";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
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
        {/* Initial loading screen styles - must be inline to show immediately */}
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
              
              /* Loading screen that shows immediately */
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
            `,
          }}
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
        
        {/* React-based loading screen for client-side navigation */}
        <LoadingScreen />
        
        {/* Script to handle loading transition */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var loadingScreen = document.getElementById('initial-loading');
                var mainContent = document.getElementById('main-content');
                var checkInterval;
                var startTime = Date.now();
                var minLoadTime = 500; // Minimum time to show loading screen
                
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
                
                function checkReady() {
                  // Check if all critical resources are loaded
                  if (document.readyState === 'complete') {
                    // Additional check for stylesheets
                    var sheets = document.styleSheets;
                    var allLoaded = true;
                    
                    for (var i = 0; i < sheets.length; i++) {
                      try {
                        var rules = sheets[i].cssRules || sheets[i].rules;
                        if (!rules) allLoaded = false;
                      } catch (e) {
                        // External stylesheets might throw, but that's okay
                      }
                    }
                    
                    if (allLoaded) {
                      clearInterval(checkInterval);
                      hideLoading();
                    }
                  }
                }
                
                // Start checking immediately
                checkInterval = setInterval(checkReady, 50);
                
                // Fallback: hide after 3 seconds regardless
                setTimeout(function() {
                  clearInterval(checkInterval);
                  hideLoading();
                }, 3000);
                
                // Also listen for window load event
                window.addEventListener('load', function() {
                  clearInterval(checkInterval);
                  hideLoading();
                });
              })();
            `,
          }}
        />
      </body>
    </html>
  );
} 
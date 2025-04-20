import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Import ApiDebugger with dynamic loading to avoid SSR issues
const ApiDebugger = dynamic(
  () => import('@/components/debugger/ApiDebugger'),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PivotAI - Career Development Platform',
  description: 'AI-powered career development and job matching platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          
          {/* Include API Debugger (visible with Alt+D) */}
          <ApiDebugger />
        </AuthProvider>
      </body>
    </html>
  );
} 
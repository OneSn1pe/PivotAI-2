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

// Import ErrorDebugger with dynamic loading
const ErrorDebugger = dynamic(
  () => import('@/components/debugger/ErrorDebugger'),
  { ssr: false }
);

// Import ApiTester with dynamic loading
const ApiTester = dynamic(
  () => import('@/components/debugger/ApiTester'),
  { ssr: false }
);

// Import DiagnosticTools with dynamic loading
const DiagnosticTools = dynamic(
  () => import('@/components/debugger/DiagnosticTools'),
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
          
          {/* Include Error Debugger (visible with Alt+E) */}
          <ErrorDebugger />
          
          {/* Include API Tester (visible with Alt+T) */}
          <ApiTester />
          
          {/* Include Advanced Diagnostics (visible with Alt+G) */}
          <DiagnosticTools />
        </AuthProvider>
      </body>
    </html>
  );
} 
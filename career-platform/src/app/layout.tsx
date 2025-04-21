import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PivotAI - Career Development Platform',
  description: 'AI-powered career development and job matching platform',
};

// Import client components with dynamic loading
const ClientLayout = dynamic(
  () => import('../components/layout/ClientLayout'),
  { ssr: false }
);

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
          <ClientLayout />
        </AuthProvider>
      </body>
    </html>
  );
} 
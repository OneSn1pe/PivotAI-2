import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthWrapper from '@/components/AuthWrapper';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Career Platform',
  description: 'AI-powered career development platform for candidates and recruiters',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
} 
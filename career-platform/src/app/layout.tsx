import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Career Platform',
  description: 'AI-powered career development platform for candidates and recruiters',
};

export default function RootLayout({
  children,
}: {
  children
import "@/styles/globals.css";
import "@/styles/cloud-theme.css";
import "@/styles/fantasy-theme.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PivotAI Career Quest - MMORPG",
  description: "Your professional journey as an epic adventure",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {/* Fantasy game background */}
          <div className="game-background"></div>
          <div className="parallax-fantasy">
            <div className="fantasy-element stars-layer"></div>
            <div className="fantasy-element floating-runes"></div>
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
} 
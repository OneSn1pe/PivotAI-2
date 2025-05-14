import "@/styles/globals.css";
import "@/styles/cloud-theme.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PivotAI - Career Roadmap Platform",
  description: "AI-powered career roadmaps and resume analysis",
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
          {/* Cloud parallax background */}
          <div className="parallax-clouds">
            <div className="cloud-parallax cloud-layer-1">
              <div className="cloud-lg"></div>
            </div>
            <div className="cloud-parallax cloud-layer-2">
              <div className="cloud-md"></div>
            </div>
            <div className="cloud-parallax cloud-layer-3">
              <div className="cloud-lg"></div>
            </div>
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
} 
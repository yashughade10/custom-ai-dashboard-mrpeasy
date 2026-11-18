import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { RQProvider } from "@/lib/provider";
import { Toaster } from "@/components/ui/sonner";
import { PwaProvider } from "@/components/pwa/PwaProvider";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#014FA2",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  applicationName: "Vaclift AI Dashboard",
  title: "Vaclift AI Dashboard",
  description: "AI Dashboard for Vaclift",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vaclift",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Vaclift AI Dashboard",
    description:
      "Monitor, analyze, and manage Vaclift systems with our AI-powered dashboard. Built for efficiency and real-time insights.",
    url: "https://dashboard.vacliftaustralia.com",
    images: ['/icons/icon-512x512.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <RQProvider>
          <PwaProvider>
            {children}
            <Toaster />
          </PwaProvider>
        </RQProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { Toaster } from "sonner";
import WorksitePwaProvider from "@/components/WorksitePwaProvider";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "GetPlanning — Worksite Management",
  description: "Plateforme SaaS de gestion de projet de construction de nouvelle génération",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#1a0533",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={spaceGrotesk.className}>
        <ThemeProvider>
        <LanguageProvider>
          <WorksitePwaProvider />
          {children}
        </LanguageProvider>
        </ThemeProvider>
        <Toaster 
          theme="dark"
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: 'rgba(10, 16, 32, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              fontFamily: 'inherit',
            },
          }}
        />
      </body>
    </html>
  );
}

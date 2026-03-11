import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "GetPlanning — Worksite Management",
  description: "Plateforme SaaS de gestion de projet de construction de nouvelle génération",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GetPlanning",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#1a0533",
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

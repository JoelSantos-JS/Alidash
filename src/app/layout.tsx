import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/performance-optimized.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { SupabaseAuthProvider } from "@/hooks/use-supabase-auth";
import { DataProvider } from "@/contexts/data-context";
import { AccountTypeProvider } from "@/contexts/account-type-context";


const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-body",
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "VoxCash - Gestão Completa",
  description: "Sistema completo de gestão pessoal e empresarial com notificações inteligentes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VoxCash"
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "VoxCash",
    "application-name": "VoxCash",
    "msapplication-TileColor": "#2563eb",
    "msapplication-config": "/browserconfig.xml"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* DNS Prefetch para recursos externos */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//googleapis.com" />
        
        {/* Preconnect para recursos críticos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* PWA Icons */}
        <link rel="icon" type="image/svg+xml" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <link rel="mask-icon" href="/icon-192x192.svg" color="#2563eb" />
        
        {/* Scripts externos removidos temporariamente para depuração */}

      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SupabaseAuthProvider>
            <AccountTypeProvider>
              <DataProvider>
                {children}
                <Toaster />
                <SonnerToaster 
                  theme="dark"
                  position="top-right"
                  richColors
                  closeButton
                />
                {/* Script inline de limpeza removido temporariamente para depuração do erro */}
              </DataProvider>
            </AccountTypeProvider>
          </SupabaseAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

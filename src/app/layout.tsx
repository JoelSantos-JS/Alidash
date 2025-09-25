import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-body",
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "Alidash - Gestão Completa",
  description: "Sistema completo de gestão pessoal e empresarial com notificações inteligentes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alidash"
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Alidash",
    "application-name": "Alidash",
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
        {/* PWA Icons */}
        <link rel="icon" type="image/svg+xml" href="/icon-192x192.svg" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <link rel="mask-icon" href="/icon-192x192.svg" color="#2563eb" />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registrado com sucesso:', registration.scope);
                    })
                    .catch(function(error) {
                      console.log('Falha ao registrar SW:', error);
                    });
                });
              }
            `,
          }}
        />
        
        {/* Chunk Error Handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Handler global para erros de chunks
              window.addEventListener('error', function(event) {
                if (event.error && (
                  event.error.name === 'ChunkLoadError' ||
                  event.message.includes('Loading chunk') ||
                  event.message.includes('Loading CSS chunk')
                )) {
                  console.warn('🔄 Erro de chunk detectado, recarregando...', event.error);
                  setTimeout(function() {
                    window.location.reload();
                  }, 1000);
                }
              });
              
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && event.reason.message && (
                  event.reason.message.includes('Loading chunk') ||
                  event.reason.message.includes('Failed to import')
                )) {
                  console.warn('🔄 Promise rejeitada por chunk, recarregando...', event.reason);
                  setTimeout(function() {
                    window.location.reload();
                  }, 1000);
                }
              });
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
              {children}
              <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

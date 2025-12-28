import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { NavbarWrapper } from "@/components/NavbarWrapper";
import { SessionProvider } from "@/components/SessionProvider";
import { TransactionsProvider } from "@/context/TransactionsContext";
import { ChatInterface } from "@/components/ChatInterface";
import { MobileNav } from "@/components/MobileNav";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// SEO Metadata
export const metadata: Metadata = {
  title: {
    default: "ClerQ - Smart Financial Analytics & Transaction Management",
    template: "%s | ClerQ"
  },
  description: "AI-powered financial analytics platform. Upload bank statements, get intelligent transaction categorization, track budgets, and gain insights into your spending patterns.",
  keywords: ["finance", "analytics", "transactions", "budgeting", "AI categorization", "bank statements", "financial insights", "expense tracking"],
  authors: [{ name: "ClerQ" }],
  creator: "ClerQ",
  publisher: "ClerQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: "ClerQ - Smart Financial Analytics",
    description: "AI-powered transaction categorization and financial insights",
    url: "/",
    siteName: "ClerQ",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClerQ - Smart Financial Analytics",
    description: "AI-powered transaction categorization and financial insights",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://accounts.google.com" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Skip to main content
        </a>

        <SessionProvider>
          <TransactionsProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="relative flex min-h-screen flex-col">
                <Suspense fallback={<div className="h-16 border-b bg-background" />}>
                  <NavbarWrapper />
                </Suspense>
                <main id="main-content" className="flex-1 overflow-x-hidden pb-20 md:pb-0">
                  {children}
                </main>
                <ChatInterface />
                <MobileNav />
                <Toaster />
              </div>
            </ThemeProvider>
          </TransactionsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "sileo/styles.css";
import { Toaster } from "@/components/console/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { APP_NAME } from "@/constant/app-constant";
import { Analytics } from '@vercel/analytics/next';
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — catch, inspect & replay webhooks`,
  description: "Catch, inspect, replay, and forward webhooks — free forever, no sign-up, 30-day history. Built-in MCP server and REST API so your AI agent can debug with you.",
  metadataBase: new URL('https://webhook.projext.in/'),
  manifest: '/site.webmanifest',
  openGraph: {
    title: `${APP_NAME} — catch, inspect & replay webhooks`,
    description: "Catch, inspect, replay, and forward webhooks — free forever, no sign-up, 30-day history. Built-in MCP server and REST API so your AI agent can debug with you.",
    url: 'https://webhook.projext.in/',
    siteName: APP_NAME,
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: APP_NAME,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — catch, inspect & replay webhooks`,
    description: "Catch, inspect, replay, and forward webhooks — free forever, no sign-up, 30-day history. Built-in MCP server and REST API so your AI agent can debug with you.",
    images: ['/android-chrome-512x512.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  alternates: {
    canonical: '/',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08110d' },
    { media: '(prefers-color-scheme: light)', color: '#eef6f1' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${hankenGrotesk.variable} ${jetBrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >

          {children}
          <Toaster />
           <Analytics />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}

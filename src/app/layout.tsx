import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from "@/components/theme-provider";
import { APP_NAME } from "@/constant/app-constant";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: "A modern webhook testing and debugging platform. Create endpoints, inspect requests, and forward webhooks to multiple destinations.",
  metadataBase: new URL('https://your-domain.com'),
  openGraph: {
    title: APP_NAME,
    description: "A modern webhook testing and debugging platform. Create endpoints, inspect requests, and forward webhooks to multiple destinations.",
    url: 'https://your-domain.com',
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
    title: APP_NAME,
    description: "A modern webhook testing and debugging platform. Create endpoints, inspect requests, and forward webhooks to multiple destinations.",
    images: ['/android-chrome-512x512.png'],
    creator: '@your_twitter_handle',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  themeColor: '#ffffff',
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased mx-auto`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >

          {children}
          <Toaster
            position="top-right"
            reverseOrder={false}
          />
           <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

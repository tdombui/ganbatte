import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ganbatte Payload Movers",
  description: "AI-powered parts delivery service for auto builders, shops and tuners. Anywhere in SoCal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyDyppTQmiJKw-k8Y6A1nApOuIY332vuGK4&libraries=geometry`}
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}

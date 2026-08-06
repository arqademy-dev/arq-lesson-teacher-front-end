import type { Metadata } from "next";
import { Geist, Geist_Mono, Comfortaa } from "next/font/google";
import "./globals.css";

// 1. Initialize Comfortaa and define its CSS variable name
const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  display: "swap", // Ensures fast loading without font layout shifts
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARQADEMY",
  description: "Student Learning Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // 2. Add the comfortaa.variable class here
      className={`${comfortaa.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}

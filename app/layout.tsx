import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider"; // 1. Import AuthProvider-nya di sini bro

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Batu Bata Pak Tamril",
  description: "Sistem Informasi Manajemen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Font Custom */}
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

        {/* LINK MATERIAL SYMBOLS YANG BENER DAN VALID */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* 2. Bungkus {children} dengan AuthProvider supaya useSession di halaman karyawan aktif */}
        <AuthProvider>{children}</AuthProvider>

        {/* Toaster melayang di pojok kanan atas */}
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            style: {
              fontFamily: "'Work_Sans', sans-serif",
              fontSize: "14px",
              fontWeight: "600",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}

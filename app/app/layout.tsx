import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import AppKitProvider from "@/components/AppKitProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SplitBase - Onchain Split Payments on Base",
  description: "Automatically split payments among multiple recipients on Base blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <AppKitProvider>
          <Navigation />
          <main className="min-h-screen">{children}</main>
        </AppKitProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    template: "%s | Eye-Club",
    default: "Eye-Club | See Better. Look Better."
  },
  description: "Premium optical e-commerce offering high-quality prescription glasses, sunglasses, and professional optometrist services.",
  keywords: ["eyeglasses", "sunglasses", "optometrist", "eye exam", "contact lenses", "premium eyewear", "Nepal eyewear"],
  authors: [{ name: "Eye-Club" }],
  openGraph: {
    title: "Eye-Club | See Better. Look Better.",
    description: "Premium optical e-commerce offering high-quality prescription glasses and services.",
    type: "website",
    locale: "en_NP",
    siteName: "Eye-Club",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eye-Club | See Better. Look Better.",
    description: "Premium optical e-commerce offering high-quality prescription glasses and services.",
  },
};

import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

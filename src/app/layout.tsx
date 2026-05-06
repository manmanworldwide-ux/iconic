import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
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
  title: {
    default: "Iconic — Modern SaaS Template",
    template: "%s | Iconic",
  },
  description:
    "A production-ready SaaS template built with Next.js, Supabase, TypeScript, and Tailwind CSS.",
  openGraph: {
    title: "Iconic — Modern SaaS Template",
    description: "Production-ready SaaS template with auth, dashboard, and more.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Iconic. Built with Next.js, Supabase &amp; Tailwind CSS.
        </footer>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trace.dev"),
  title: {
    default: "Trace: The modern way to complete Striver's A2Z DSA Sheet",
    template: "%s · Trace",
  },
  description:
    "Trace is the focused workspace for Striver's A2Z DSA Sheet. Watch the mapped lecture, solve on LeetCode/GFG, take notes and track your progress, all in one place. No more juggling tabs.",
  keywords: [
    "Striver A2Z",
    "A2Z DSA Sheet",
    "DSA",
    "interview preparation",
    "LeetCode",
    "takeuforward",
  ],
  authors: [{ name: "Trace" }],
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Trace: Complete Striver's A2Z DSA Sheet",
    description:
      "Watch the lecture, solve the problem, and track your progress. Everything you need to finish Striver A2Z in one place.",
    type: "website",
    siteName: "Trace",
    images: [
      { url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "Trace" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trace: Complete Striver's A2Z DSA Sheet",
    description:
      "Everything you need to finish Striver A2Z in one focused workspace.",
    images: ["/android-chrome-512x512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark h-full", inter.variable, instrumentSerif.variable)}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}

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
    default: "Trace — The modern way to complete Striver's A2Z DSA Sheet",
    template: "%s · Trace",
  },
  description:
    "Trace is the focused workspace for Striver's A2Z DSA Sheet — watch the mapped lecture, solve on LeetCode/GFG, take notes and track your progress, all in one place. No more juggling tabs.",
  keywords: [
    "Striver A2Z",
    "A2Z DSA Sheet",
    "DSA",
    "interview preparation",
    "LeetCode",
    "takeuforward",
  ],
  authors: [{ name: "Trace" }],
  openGraph: {
    title: "Trace — Complete Striver's A2Z DSA Sheet",
    description:
      "Watch the lecture, solve the problem, track your progress — everything you need to finish Striver A2Z in one place.",
    type: "website",
    siteName: "Trace",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trace — Complete Striver's A2Z DSA Sheet",
    description:
      "Everything you need to finish Striver A2Z in one focused workspace.",
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

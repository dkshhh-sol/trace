import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

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
    default: "Trace — The workspace for technical interview prep",
    template: "%s · Trace",
  },
  description:
    "Trace unifies structured roadmaps, embedded lectures, coding problems, notes, spaced revision and analytics into one developer-first workspace. Stop juggling tabs and start making progress.",
  keywords: [
    "interview preparation",
    "DSA",
    "coding roadmap",
    "Striver A2Z",
    "LeetCode",
    "spaced repetition",
    "developer tools",
  ],
  authors: [{ name: "Trace" }],
  openGraph: {
    title: "Trace — The workspace for technical interview prep",
    description:
      "One workspace for roadmaps, lectures, problems, notes, revision and analytics.",
    type: "website",
    siteName: "Trace",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trace — The workspace for technical interview prep",
    description:
      "One workspace for roadmaps, lectures, problems, notes, revision and analytics.",
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
      className={`${inter.variable} ${instrumentSerif.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}

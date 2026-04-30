import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BiteSync — Meal Planning & Grocery Sync",
    template: "%s | BiteSync",
  },
  description:
    "Plan your meals, track your nutrition, and generate your grocery list automatically. BiteSync makes weekly meal planning effortless.",
  keywords: [
    "meal planner",
    "grocery list",
    "nutrition tracker",
    "macro calculator",
    "TDEE calculator",
    "meal planning app",
    "weekly meal plan",
  ],
  authors: [{ name: "BiteSync" }],
  creator: "BiteSync",
  metadataBase: new URL("https://bitesync.io"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://bitesync.io",
    siteName: "BiteSync",
    title: "BiteSync — Meal Planning & Grocery Sync",
    description: "Plan your meals, track your nutrition, and generate your grocery list automatically.",
  },
  twitter: {
    card: "summary_large_image",
    title: "BiteSync — Meal Planning & Grocery Sync",
    description: "Plan your meals, track your nutrition, and generate your grocery list automatically.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light" className={`${inter.variable} ${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

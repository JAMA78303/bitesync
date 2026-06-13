import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ThemeSync } from "@/components/shared/ThemeSync";
import "./globals.css";

const inter = Inter({
 variable:"--font-inter",
 subsets: ["latin"],
 display:"swap",
});

export const metadata: Metadata = {
 title: {
 default: "BiteSync — Plan meals to your macros",
 template: "%s | BiteSync",
 },
 description:
  "Plan your week, hit your protein and calorie targets, and get one grocery list — automatically. Free to start.",
 keywords: [
  "meal planner",
  "macro meal plan",
  "grocery list",
  "nutrition tracker",
  "macro calculator",
  "TDEE calculator",
  "meal planning app",
  "weekly meal plan",
  "protein target",
 ],
 authors: [{ name: "BiteSync" }],
 creator: "BiteSync",
 metadataBase: new URL("https://bitesync.io"),
 openGraph: {
 type: "website",
 locale: "en_GB",
 url: "https://bitesync.io",
 siteName: "BiteSync",
 title: "BiteSync — Plan meals to your macros",
 description:
  "Plan your week, hit your protein and calorie targets, and get one grocery list — automatically.",
 images: [
  {
   url: "/opengraph-image",
   width: 1200,
   height: 630,
   alt: "BiteSync — your week of meals, planned to your macros",
  },
 ],
 },
 twitter: {
 card: "summary_large_image",
 title: "BiteSync — Plan meals to your macros",
 description:
  "Plan your week, hit your protein and calorie targets, and get one grocery list — automatically.",
 },
 /** File-based icons in `app/` (favicon.ico, icon.png, apple-icon.png). Extra PNG sizes in `public/`. */
 manifest: "/manifest.webmanifest",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" suppressHydrationWarning className={`${inter.variable} ${inter.className} h-full antialiased`}>
 <head>
 <script
 dangerouslySetInnerHTML={{
 __html: `(function() {
 try {
 var storedTheme = localStorage.getItem("theme") || localStorage.getItem("bitesync-theme");
 var theme = storedTheme;
 if (!theme || theme ==="system") {
 theme = window.matchMedia("(prefers-color-scheme: dark)").matches ?"dark" :"light";
 }
 var root = document.documentElement;
 root.classList.remove("light","dark");
 root.classList.add(theme);
 root.setAttribute("data-theme", theme);
 root.style.colorScheme = theme;
 } catch (e) {}
})();`,
 }}
 />
 </head>
 <body className="min-h-full flex flex-col">
 <ThemeProvider
 attribute="data-theme"
 defaultTheme="system"
 enableSystem
 disableTransitionOnChange
 storageKey="theme"
 >
 <ThemeSync />
 {children}
 </ThemeProvider>
 </body>
 </html>
 );
}

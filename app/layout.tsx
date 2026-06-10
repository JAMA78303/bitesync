import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { ThemeSync } from "@/components/shared/ThemeSync";
import "./globals.css";

const inter = Inter({
 variable:"--font-inter",
 subsets: ["latin"],
});

export const metadata: Metadata = {
 title: {
 default:"BiteSync — Meal Planning & Grocery Sync",
 template:"%s | BiteSync",
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
 authors: [{ name:"BiteSync" }],
 creator:"BiteSync",
 metadataBase: new URL("https://bitesync.io"),
 openGraph: {
 type:"website",
 locale:"en_GB",
 url:"https://bitesync.io",
 siteName:"BiteSync",
 title:"BiteSync — Meal Planning & Grocery Sync",
 description:"Plan your meals, track your nutrition, and generate your grocery list automatically.",
 },
 twitter: {
 card:"summary_large_image",
 title:"BiteSync — Meal Planning & Grocery Sync",
 description:"Plan your meals, track your nutrition, and generate your grocery list automatically.",
 },
 /** Static files in `/public` — avoids dynamic icon routes failing on some hosts. */
 icons: {
 icon: [
 { url:"/favicon.ico", sizes:"16x16", type:"image/x-icon" },
 { url:"/icon.png", type:"image/png", sizes:"48x48" },
 ],
 shortcut:"/favicon.ico",
 apple: [{ url:"/apple-touch-icon.png", sizes:"180x180", type:"image/png" }],
 },
 manifest:"/manifest.webmanifest",
};

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" suppressHydrationWarning className={`${inter.variable} ${inter.className} h-full antialiased`}>
 <head>
 <link rel="icon" href="/favicon.ico" sizes="any" />
 <link rel="icon" href="/icon.png" type="image/png" sizes="48x48" />
 <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
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

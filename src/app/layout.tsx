import type { Metadata } from "next";
import { AmbientBackground } from "@/components/ambient-background";
import { ScrollProgress } from "@/components/scroll-progress";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const ibmMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gian-portfolio.vercel.app"),
  title: {
    default: "Minimal Futuristic Portfolio",
    template: "%s — Gian",
  },
  description:
    "Minimal futuristic portfolio blending organic motion, spatial depth, and interactive storytelling for digital product design.",
  keywords: [
    "product designer",
    "portfolio",
    "minimal",
    "futuristic",
    "interactive",
    "framer motion",
    "gsap",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gian-portfolio.vercel.app",
    title: "Gian — Minimal Futuristic Portfolio",
    description:
      "Minimal futuristic portfolio blending organic motion, spatial depth, and interactive storytelling for digital product design.",
    siteName: "Gian Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@gian",
    title: "Gian — Minimal Futuristic Portfolio",
    description:
      "Minimal futuristic portfolio blending organic motion, spatial depth, and interactive storytelling for digital product design.",
  },
  category: "portfolio",
  authors: [{ name: "Gian" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sora.variable} ${ibmMono.variable} antialiased min-h-screen relative overflow-x-hidden`}
      >
        <AmbientBackground />
        <ScrollProgress />
        <div className="grid-overlay" aria-hidden />
        {children}
      </body>
    </html>
  );
}

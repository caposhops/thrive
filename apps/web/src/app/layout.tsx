import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://thrive-web-zeta.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Thrive — Raise Your Vibration",
    template: "%s · Thrive",
  },
  description:
    "An emotionally intelligent ADHD productivity and personal transformation platform. Structure, healing, vision boards, and AI coaching in one calm, dopamine-friendly ecosystem.",
  applicationName: "Thrive",
  authors: [{ name: "Thrive" }],
  keywords: [
    "ADHD",
    "productivity",
    "vision board",
    "habit tracker",
    "AI coach",
    "mental wellness",
    "dopamine",
    "self-improvement",
    "mindfulness",
    "goal setting",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Thrive",
  },
  openGraph: {
    type: "website",
    title: "Thrive — Raise Your Vibration",
    description:
      "An emotionally intelligent ADHD productivity and personal transformation platform.",
    url: SITE_URL,
    siteName: "Thrive",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thrive — Raise Your Vibration",
    description:
      "An emotionally intelligent ADHD productivity and personal transformation platform.",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

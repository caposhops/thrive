import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Thrive — Raise Your Vibration",
  description:
    "An emotionally intelligent ADHD productivity and personal transformation platform. Structure, healing, vision boards, and AI coaching in one calm, dopamine-friendly ecosystem.",
  metadataBase: new URL("https://thrive.app"),
};

export const viewport: Viewport = {
  themeColor: "#0b0712",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}

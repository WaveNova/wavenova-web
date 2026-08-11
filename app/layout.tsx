import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "WaveNova — Stopping ocean waste at the source",
  description:
    "WaveNova builds sorting stations in South Lombok, Indonesia, and runs monthly beach cleanups in Taiwan. Intercepting ocean plastic before it reaches the sea.",
  openGraph: {
    title: "WaveNova — Stopping ocean waste at the source",
    description: "Five sorting stations, 276,731 kg handled, 76 member businesses.",
    siteName: "WaveNova",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full flex flex-col font-[var(--font-dm-sans)] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

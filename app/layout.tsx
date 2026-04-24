import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
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

export const metadata: Metadata = {
  title: "WaveNova — Social Impact Project Accelerator",
  description:
    "Connecting global donors to grassroots environmental projects in Lombok, Indonesia. Real-time impact tracking, transparent fund allocation, and hands-on project support.",
  openGraph: {
    title: "WaveNova — Social Impact Project Accelerator",
    description: "Every dollar is project-tagged and publicly reported.",
    siteName: "WaveNova",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body className="min-h-full flex flex-col font-[var(--font-dm-sans)] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

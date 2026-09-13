import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const interHeading = Inter({ subsets: ["latin"], variable: "--font-heading" });
const ibmPlexSans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-sans" });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NetLab — Network Learning Lab",
  description: "Interactive browser-first network simulator for high-school students.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, ibmPlexSans.variable, interHeading.variable)}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

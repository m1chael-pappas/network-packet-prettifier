import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Network Packet Prettifier",
  description: "Advanced packet analysis with modern visualization. Upload captures or paste data to decode network traffic.",
  keywords: ["packet analysis", "network", "wireshark", "pcap", "network security", "packet capture"],
  authors: [{ name: "Network Packet Prettifier" }],
  creator: "Network Packet Prettifier",
  publisher: "Network Packet Prettifier",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: [
      { url: "/icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Network Packet Prettifier",
    description: "Advanced packet analysis with modern visualization. Upload captures or paste data to decode network traffic.",
    type: "website",
    siteName: "Network Packet Prettifier",
  },
  twitter: {
    card: "summary_large_image",
    title: "Network Packet Prettifier",
    description: "Advanced packet analysis with modern visualization. Upload captures or paste data to decode network traffic.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

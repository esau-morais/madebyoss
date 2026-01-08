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
  title: "madebyoss // See who made your stack",
  description:
    "Every line of AI-assisted code stands on the shoulders of OSS maintainers. We make them visible again.",
  openGraph: {
    title: "madebyoss — See who made your stack",
    description:
      "Every line of AI-assisted code stands on the shoulders of OSS maintainers. We make them visible again.",
    url: "https://madebyoss.com",
    siteName: "madebyoss",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "madebyoss — See who made your stack",
    description:
      "Every line of AI-assisted code stands on the shoulders of OSS maintainers. We make them visible again.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scrollbar-thin">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased selection:bg-foreground/15`}
      >
        {children}
      </body>
    </html>
  );
}

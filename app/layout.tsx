import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "90-Day Business Plan | Urban Eye",
  description:
    "Answer a few questions and get a clear 90-day plan for your website, sales, product data, and operations.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "The Urban Eye 90-Day Business Plan",
    description:
      "Find what to fix first and get three clear next moves.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

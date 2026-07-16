import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Business Modernization Blueprint | Urban Eye",
  description:
    "Build a practical 90-day plan for improving how your business looks, sells, markets, and operates.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "The Urban Eye Business Modernization Blueprint",
    description:
      "A personalized 90-day roadmap across website, commerce, marketing, and technology.",
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

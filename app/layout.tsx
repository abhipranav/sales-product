import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Analytics } from "@vercel/analytics/next";

function getMetadataBase() {
  const configured = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      return new URL(configured);
    } catch {
      return new URL("http://localhost:3000");
    }
  }

  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "VelocityOS — AI Sales Execution",
  description: "Conversation-first AI sales execution cockpit",
  openGraph: {
    title: "VelocityOS — AI Sales Execution",
    description: "Pipeline, intelligence, and execution workflows in one operating layer.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VelocityOS workspace preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "VelocityOS — AI Sales Execution",
    description: "Pipeline, intelligence, and execution workflows in one operating layer.",
    images: ["/opengraph-image"]
  }
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Libre+Barcode+39+Text&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}

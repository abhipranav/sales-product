import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { readEnvUrl } from "@/lib/env";

function getMetadataBase() {
  const configured = readEnvUrl("APP_BASE_URL") ?? readEnvUrl("NEXT_PUBLIC_APP_URL");
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
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

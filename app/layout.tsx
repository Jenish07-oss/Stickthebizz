import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F5EBDD",
};

export const metadata: Metadata = {
  title: "StickTheBizz — Turn Walk-ins into Daily Regulars",
  description:
    "Gamified digital punch-card and streak loyalty SaaS tailored for Indian retail, cafés, and kirana stores. Zero app downloads.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "StickTheBizz.in — QR Loyalty for Bharat",
    description: "Zero app downloads. Turn walk-in diners and kirana shoppers into daily regulars.",
    url: "https://stickthebizz.in",
    siteName: "StickTheBizz",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${ibmPlexMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://xzvpjprnexurgohfnimq.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://xzvpjprnexurgohfnimq.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-sand font-sans text-ink antialiased selection:bg-coral/20 selection:text-coral overflow-x-hidden">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}


import type { Metadata, Viewport } from "next";
import { Fira_Code, Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { MobileViewportSync } from "@/components/mobile-viewport-sync";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

/** Brand wordmark "Minorum" — body UI stays Geist. */
const funnelDisplay = localFont({
  src: "../public/fonts/FunnelDisplay-ExtraBold.woff2",
  variable: "--font-funnel-display",
  weight: "800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Minorum",
  description: "Client chat AI pribadi — casual, hangat, semi-blak-blakan.",
  icons: {
    icon: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
  appleWebApp: {
    capable: true,
    title: "Minorum",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
  // Android Chrome: shrink layout when keyboard opens
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${firaCode.variable} ${funnelDisplay.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="minorum_theme";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t="dark";localStorage.setItem(k,t);}if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}else{document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){document.documentElement.classList.add("dark");}})();`,
          }}
        />
      </head>
      <body
        className="flex h-[var(--app-height,100dvh)] flex-col overflow-hidden bg-background text-foreground"
        suppressHydrationWarning
      >
        <MobileViewportSync />
        {children}
      </body>
    </html>
  );
}

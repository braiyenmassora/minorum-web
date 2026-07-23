import type { Metadata, Viewport } from "next";
import { Fira_Code, Geist, IBM_Plex_Sans } from "next/font/google";
import { MobileViewportSync } from "@/components/mobile-viewport-sync";
import { AppToastHost } from "@/components/ui/app-toast";
import "./globals.css";

/** Body UI — IBM Plex Sans. */
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/** Display & wordmark — Geist Sans (greeting, user name, Minorum title). */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  // Pinch zoom left enabled for accessibility (no maximumScale / userScalable lock).
  viewportFit: "cover",
  themeColor: "#0f0f0f",
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
      className={`${ibmPlexSans.variable} ${geistSans.variable} ${firaCode.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="minorum_theme";var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t="dark";localStorage.setItem(k,t);}var el=document.documentElement;var dark=t!=="light";if(dark){el.classList.add("dark");el.style.colorScheme="dark";}else{el.classList.remove("dark");el.style.colorScheme="light";}var c=dark?"#0f0f0f":"#f5f5f5";var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m);}m.setAttribute("content",c);}catch(e){document.documentElement.classList.add("dark");}})();`,
          }}
        />
      </head>
      <body
        className="flex h-[var(--app-height,100dvh)] flex-col overflow-hidden bg-background text-foreground"
        suppressHydrationWarning
      >
        <MobileViewportSync />
        <AppToastHost />
        {children}
      </body>
    </html>
  );
}

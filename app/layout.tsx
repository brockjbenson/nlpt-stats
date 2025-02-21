import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Viewport } from "next";
import InstallPrompt from "@/components/install-prompt";

const defaultUrl =
  process.env.NEXT_PUBLIC_SITE_URL || // Preferred for public environment variables
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata = {
  metadataBase: new URL(defaultUrl), // Ensures metadataBase is always a valid URL
  manifest: "/manifest.json",
  title: "NLPT - Stats",
  description: "Northern Lights Poker Tour Stats",
  other: { "apple-mobile-web-app-capable": "yes" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    startupImage: [
      {
        url: "/splash_screens/iPhone_16_Pro_Max_landscape.png",
        media:
          "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_16_Pro_landscape.png",
        media:
          "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_landscape.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro_landscape.png",
        media:
          "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_landscape.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_landscape.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X_landscape.png",
        media:
          "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_landscape.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_11__iPhone_XR_landscape.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/13__iPad_Pro_M4_landscape.png",
        media:
          "(device-width: 1032px) and (device-height: 1376px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/12.9__iPad_Pro_landscape.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/11__iPad_Pro_M4_landscape.png",
        media:
          "(device-width: 834px) and (device-height: 1210px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/10.9__iPad_Air_landscape.png",
        media:
          "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)",
      },
      {
        url: "/splash_screens/iPhone_16_Pro_Max_portrait.png",
        media:
          "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash_screens/iPhone_16_Pro_portrait.png",
        media:
          "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash_screens/iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max_portrait.png",
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash_screens/iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max_portrait.png",
        media:
          "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash_screens/iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12_portrait.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash_screens/iPhone_11_Pro_Max__iPhone_XS_Max_portrait.png",
        media:
          "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
      {
        url: "/splash_screens/10.9__iPad_Air_portrait.png",
        media:
          "(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false,
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <head>
        {/* Inject a small script to detect standalone mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
                document.documentElement.classList.add('pwa-mode');
              }
            `,
          }}
        />
      </head>
      <body className="bg-background overflow-x-hidden min-h-screen text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          {children}
          <InstallPrompt />
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

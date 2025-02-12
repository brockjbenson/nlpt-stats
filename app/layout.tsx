import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import MobileNav from "@/components/header/mobile-nav";
import PullToRefresh from "@/components/refresh-wrapper/refresh-wrapper";

const defaultUrl =
  process.env.NEXT_PUBLIC_SITE_URL || // Preferred for public environment variables
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata = {
  metadataBase: new URL(defaultUrl), // Ensures metadataBase is always a valid URL
  title: "NLPT - Stats",
  description: "Northern Lights Poker Tour Stats",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <body className="bg-background overflow-hidden text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange>
          <PullToRefresh>{children}</PullToRefresh>
          <MobileNav />
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}

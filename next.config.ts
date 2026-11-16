import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages are prebuilt shells: cached data ("use cache") is included, and
  // anything read per request (the signed-in menu) streams into a <Suspense>.
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "ifphuki321.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  reactStrictMode: false,
};

export default nextConfig;

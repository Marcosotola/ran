import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.ceramicas-lourdes.com.ar',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    reactCompiler: true,
    // Optimize package imports for better performance
    optimizePackageImports: [
      'react-icons',
      'framer-motion',
      '@mui/material',
      '@mui/icons-material'
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
    ],
  }
};

export default nextConfig;

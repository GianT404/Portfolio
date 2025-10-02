import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config, options) => {
    // Cấu hình xử lý file SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });

    return config;
  },
  images: {
    disableStaticImages: false,
  },
};

export default nextConfig;

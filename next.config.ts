import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination:
          "https://arq-lesson-teacher-back-end.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
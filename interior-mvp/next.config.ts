import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Three.js/R3F 관련 트랜스파일 설정
  transpilePackages: ['three'],
  // Vercel 배포 최적화
  experimental: {
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei'],
  },
};

export default nextConfig;

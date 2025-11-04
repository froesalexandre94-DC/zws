/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // ✅ importante: SSR habilitado
  experimental: {
    appDir: true
  }
};

export default nextConfig;

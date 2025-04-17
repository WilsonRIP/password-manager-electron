/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  // Required for Electron static file serving
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

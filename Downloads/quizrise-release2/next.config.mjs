/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Handle PDF.js worker
    if (!isServer) {
      // Client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        canvas: false,
      }
      
      // Ignore PDF.js worker imports in the browser
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdfjs-dist/build/pdf.worker.js": false,
        "pdfjs-dist/build/pdf.worker.entry": false,
        "pdfjs-dist/build/pdf.worker.min.js": false,
        "pdfjs-dist/web/pdf_viewer": false,
      }
    } else {
      // Server-side bundle
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdfjs-dist": false,
        canvas: false,
      }
    }
    
    return config
  },
}

export default nextConfig

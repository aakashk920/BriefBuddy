import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'groq-sdk', '@gradio/client'],
}

export default nextConfig
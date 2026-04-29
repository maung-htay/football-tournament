/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_MESSENGER_URL: process.env.MESSENGER_URL,
    NEXT_PUBLIC_SHOW_CONTACT: process.env.SHOW_CONTACT,
  },
}

module.exports = nextConfig

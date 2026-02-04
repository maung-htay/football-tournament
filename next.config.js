/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_FACEBOOK_URL: process.env.FACEBOOK_URL,
    NEXT_PUBLIC_TIKTOK_URL: process.env.TIKTOK_URL,
    NEXT_PUBLIC_YOUTUBE_URL: process.env.YOUTUBE_URL,
    NEXT_PUBLIC_SHOW_CONTACT: process.env.SHOW_CONTACT,
  },
}

module.exports = nextConfig

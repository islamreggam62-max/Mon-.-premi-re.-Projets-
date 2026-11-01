/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The dev-only Next.js indicator defaults to bottom-left, where it covers the
  // collapsed sidebar's "Expand sidebar" control. Production is unaffected.
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;

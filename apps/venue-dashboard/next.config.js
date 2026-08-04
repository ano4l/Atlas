/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@atlas/shared-types",
    "@atlas/spatial-model",
    "@atlas/map-rendering",
    "@atlas/api-client",
  ],
};

module.exports = nextConfig;

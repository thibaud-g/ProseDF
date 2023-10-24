/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, {webpack, isServer, dev, defaultLoaders}) => {
        config.resolve.alias.canvas = false
        config.resolve.alias.encoding = false
        return config
    }
}

module.exports = nextConfig

/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [{
            source: '/sign-in',
            destination: '/api/auth/login',
            permanent: true
        },
        {
            source: '/sign-up',
            destination: '/api/auth/register',
            permanent: true
        },
    ]
    },
    webpack: (config, {webpack, isServer, dev, defaultLoaders}) => {
        config.resolve.alias.canvas = false
        config.resolve.alias.encoding = false
        return config
    }
}

module.exports = nextConfig

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude PWA folder from bundling to reduce app size
config.resolver = {
  ...config.resolver,
  blockList: [
    ...config.resolver.blockList || [],
    /pwa\/.*/,
    /backend\/.*/,
    /proxy-server\/.*/,
    /scripts\/.*/,
    /\.md$/,
  ],
};

module.exports = config;

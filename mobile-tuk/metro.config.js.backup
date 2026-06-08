const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure the resolver handles web correctly and supports various extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs', 'ts', 'tsx', 'js', 'jsx'];
config.resolver.resolverMainFields = ['browser', 'module', 'main'];

module.exports = config;

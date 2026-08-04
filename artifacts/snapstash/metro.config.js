const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude temp directories created by react-native-purchases during install
config.resolver.blockList = [
  /node_modules\/.*_tmp_\d+\/.*/,
];

module.exports = config;

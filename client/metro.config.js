const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);
const finalConfig = withUniwindConfig(config, { cssEntryFile: "./global.css" });

module.exports = finalConfig;

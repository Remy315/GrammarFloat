const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const path = require('path');

// 确保使用 client 目录的路径
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const finalConfig = withUniwindConfig(config, { cssEntryFile: "./global.css" });

module.exports = finalConfig;

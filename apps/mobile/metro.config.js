const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
// Dependency recovery folders can contain old copies of the entire app tree.
// Keep them outside Metro's source index while retaining Expo's monorepo defaults.
const blockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(blockList) ? blockList : blockList ? [blockList] : []),
  /[/\\]node_modules\.codex-[^/\\]+(?:[/\\]|$)/,
  /[/\\]node_modules[/\\]\.cache(?:[/\\]|$)/,
];
module.exports = config;

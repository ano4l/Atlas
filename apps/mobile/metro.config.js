const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
// Dependency recovery folders can contain old copies of the entire app tree.
// Keep them outside Metro's source index while retaining Expo's monorepo defaults.
const blockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(blockList) ? blockList : blockList ? [blockList] : []),
  /[/\\]node_modules\.codex-[^/\\]+(?:[/\\]|$)/,
  /[/\\]node_modules[/\\]\.cache(?:[/\\]|$)/,
  // pnpm leaves replaced packages in .ignored_* folders. OneDrive can turn their
  // files into placeholders that the file map cannot read.
  /[/\\]node_modules[/\\]\.ignored_[^/\\]+(?:[/\\]|$)/,
];
// One worker per core exhausts memory on a 16 GB laptop and kills the bundler.
config.maxWorkers = Number(process.env.METRO_MAX_WORKERS) || 2;
module.exports = config;

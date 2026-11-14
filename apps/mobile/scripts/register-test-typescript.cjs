const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const roots = [
  "../src",
  "../../../packages/api-client/src",
  "../../../packages/routing-core/src",
  "../../../packages/positioning-core/src",
].map((relative) => path.resolve(__dirname, relative) + path.sep);

require.extensions[".ts"] = (module, filename) => {
  assert.ok(roots.some((root) => filename.startsWith(root)));
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

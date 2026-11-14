const { readFileSync } = require("node:fs");
const { resolve, sep } = require("node:path");
const ts = require("typescript");

const sourceRoots = [
  resolve(__dirname, "src") + sep,
  resolve(__dirname, "../../packages/positioning-core/src") + sep,
];
require.extensions[".ts"] = (module, filename) => {
  if (!sourceRoots.some((root) => filename.startsWith(root))) throw new Error("Unexpected TypeScript module");
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  module._compile(outputText, filename);
};

const { applyCheckpointMeasurements, applyWalkSetup, compareReplay, parseReplay } = require("./src/index.ts");
const { createScenario, scenarioNames } = require("./src/scenarios.ts");
const { parseGuidancePlan, replayGuidance } = require("./src/guidance.ts");

function loadFixture(path) {
  return parseReplay(JSON.parse(readFileSync(path, "utf8")));
}

function summary(report) {
  return Object.fromEntries(Object.entries(report).map(([name, { estimates, ...metrics }]) => [name, metrics]));
}

if (require.main === module) {
  try {
    const [input, ...args] = process.argv.slice(2);
    if (input === "--suite") {
      const seed = args[0] === undefined ? 42 : Number(args[0]);
      if (args.length > 1 || !Number.isSafeInteger(seed)) throw new Error("Suite seed must be an integer");
      const results = scenarioNames.map((name) => summary(compareReplay(parseReplay(createScenario(name, seed)))));
      console.log(JSON.stringify({ seed, results }, null, 2));
    } else if (input && !input.startsWith("-")) {
      let fixture = loadFixture(input);
      let estimates = false;
      let countedSteps;
      let checkpointPath;
      let setupPath;
      let guidancePath;
      for (let index = 0; index < args.length; index++) {
        if (args[index] === "--estimates") {
          estimates = true;
        } else if (args[index] === "--counted-steps" && countedSteps === undefined) {
          const count = args[++index];
          if (!/^\d+$/.test(count ?? "") || !Number.isSafeInteger(Number(count))) {
            throw new Error("--counted-steps requires a non-negative integer");
          }
          countedSteps = Number(count);
        } else if (args[index] === "--checkpoints" && checkpointPath === undefined) {
          checkpointPath = args[++index];
          if (!checkpointPath || checkpointPath.startsWith("--")) throw new Error("--checkpoints requires a JSON file");
        } else if (args[index] === "--walk-setup" && setupPath === undefined) {
          setupPath = args[++index];
          if (!setupPath || setupPath.startsWith("--")) throw new Error("--walk-setup requires a JSON file");
        } else if (args[index] === "--guidance" && guidancePath === undefined) {
          guidancePath = args[++index];
          if (!guidancePath || guidancePath.startsWith("--")) throw new Error("--guidance requires a JSON file");
        } else {
          throw new Error("Unknown replay option: " + args[index]);
        }
      }
      if (setupPath) fixture = applyWalkSetup(fixture, JSON.parse(readFileSync(setupPath, "utf8")));
      if (checkpointPath) {
        fixture = applyCheckpointMeasurements(fixture, JSON.parse(readFileSync(checkpointPath, "utf8")));
      }
      if (countedSteps !== undefined) {
        if (fixture.device.platform === "synthetic" || fixture.truth.provenance === "simulated") {
          throw new Error("Counted steps are only for device recordings");
        }
        fixture = parseReplay({
          ...fixture,
          truth: { ...fixture.truth, provenance: "measured", stepCount: countedSteps },
        });
      }
      const report = compareReplay(fixture);
      const guidance = guidancePath && parseGuidancePlan(JSON.parse(readFileSync(guidancePath, "utf8")), fixture);
      console.log(JSON.stringify({
        ...(setupPath ? { positioningInputs: "tester-provided start and heading" } : {}),
        ...(fixture.marks?.length ? { marks: fixture.marks } : {}),
        ...(estimates ? report : summary(report)),
        ...(guidance ? { guidance: replayGuidance(fixture.venueId, guidance, report.candidate.estimates) } : {}),
      }, null, 2));
    } else {
      throw new Error("Usage: replay --suite [seed] or replay <file.json> [--estimates] [--counted-steps N] [--checkpoints measurements.json] [--walk-setup setup.json] [--guidance route.json]");
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { applyCheckpointMeasurements, applyWalkSetup, loadFixture, compareReplay, parseReplay, createScenario, scenarioNames };

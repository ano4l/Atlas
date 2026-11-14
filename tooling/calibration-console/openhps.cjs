const { performance } = require("node:perf_hooks");
const { Acceleration, Euler } = require("@openhps/core");
const { PedometerData, PedometerProcessingNode } = require("@openhps/imu");
const { loadFixture, compareReplay, parseReplay, createScenario } = require("./replay.cjs");

const scenarios = ["straight", "corner", "stop-and-resume", "rotate-in-place", "pocket", "late-packets"];

function motionWindows(fixture) {
  const samples = [];
  let lastCapture = -1;
  for (const observation of fixture.observations) {
    if (observation.kind !== "motion" ||
        observation.timestampMs > observation.receivedAtMs ||
        observation.timestampMs <= lastCapture) continue;
    samples.push(observation);
    lastCapture = observation.timestampMs;
  }
  const intervals = samples.slice(1).map((sample, i) => sample.timestampMs - samples[i].timestampMs).sort((a, b) => a - b);
  const interval = intervals[Math.floor(intervals.length / 2)];
  if (!interval || interval < 2 || interval > 100) {
    throw new Error("OpenHPS comparison needs motion samples with a median interval of 2–100 ms");
  }

  const windows = [];
  for (const sample of samples) {
    const previous = windows.at(-1)?.at(-1);
    if (!previous || sample.timestampMs - previous.timestampMs > interval * 1.5) windows.push([]);
    windows.at(-1).push(sample);
  }
  return { windows, frequency: 1000 / interval, sampleCount: samples.length };
}

async function countOpenHps(windows, frequency, readVertical) {
  const pedometer = new PedometerProcessingNode();
  let steps = 0;
  for (const window of windows) {
    const data = new PedometerData();
    data.frequency = frequency;
    for (const sample of window) {
      const amplitude = readVertical(sample);
      data.accelerometerData.push(new Acceleration(0, 0, amplitude));
      data.attitudeData.push(new Euler(0, 0, 0));
    }
    steps += (await pedometer.processPedometer(data)).length;
  }
  return steps;
}

async function comparePedometers(fixture) {
  const { windows, frequency, sampleCount } = motionWindows(fixture);
  const atlas = compareReplay(fixture).candidate;
  const magnitude = (sample) => Math.hypot(sample.accelerationX, sample.accelerationY, sample.accelerationZ) - 9.80665;
  const trials = [];
  const steps = await countOpenHps(windows, frequency, magnitude);
  for (let run = 0; run < 5; run++) {
    const started = performance.now();
    const repeated = await countOpenHps(windows, frequency, magnitude);
    if (repeated !== steps) throw new Error("OpenHPS step count changed on identical input");
    trials.push(performance.now() - started);
  }
  const verticalSamples = windows.reduce((count, window) =>
    count + window.filter((sample) => sample.verticalAccelerationMps2 !== undefined).length, 0);
  const verticalSteps = verticalSamples === sampleCount
    ? await countOpenHps(windows, frequency, (sample) => sample.verticalAccelerationMps2)
    : null;
  return {
    fixture: fixture.fixtureId,
    platform: fixture.device.platform,
    truth: fixture.truth.provenance,
    motionSamples: sampleCount,
    windows: windows.length,
    estimatedFrequencyHz: Number(frequency.toFixed(2)),
    expectedSteps: fixture.truth.stepCount ?? null,
    atlasSteps: atlas.steps,
    atlasStepError: atlas.stepCountError,
    openHpsSteps: steps,
    openHpsStepError: fixture.truth.stepCount === undefined ? null : steps - fixture.truth.stepCount,
    openHpsMedianMs: Number(trials.sort((a, b) => a - b)[2].toFixed(3)),
    verticalSamples,
    openHpsVerticalSteps: verticalSteps,
    openHpsVerticalStepError: verticalSteps === null || fixture.truth.stepCount === undefined
      ? null : verticalSteps - fixture.truth.stepCount,
  };
}

async function main([input, ...args]) {
  let fixtures;
  let seed;
  if (input === "--suite") {
    seed = args[0] === undefined ? 42 : Number(args[0]);
    if (args.length > 1 || !Number.isSafeInteger(seed)) throw new Error("Suite seed must be an integer");
    fixtures = scenarios.map((name) => parseReplay(createScenario(name, seed)));
  } else if (input && (args.length === 0 || args.length === 2 && args[0] === "--counted-steps")) {
    fixtures = [loadFixture(input)];
    if (args.length) {
      const count = Number(args[1]);
      if (!/^\d+$/.test(args[1]) || !Number.isSafeInteger(count)) {
        throw new Error("--counted-steps requires a non-negative integer");
      }
      const [fixture] = fixtures;
      if (fixture.device.platform === "synthetic" || fixture.truth.provenance === "simulated") {
        throw new Error("Counted steps are only for device recordings");
      }
      fixtures = [parseReplay({
        ...fixture,
        truth: { ...fixture.truth, provenance: "measured", stepCount: count },
      })];
    }
  } else {
    throw new Error("Usage: compare:openhps --suite [seed] or compare:openhps <file.json> [--counted-steps N]");
  }
  const results = [];
  for (const fixture of fixtures) results.push(await comparePedometers(fixture));
  console.log(JSON.stringify({ seed, method: "magnitude projected onto a synthetic vertical axis", results }, null, 2));
}

main(process.argv.slice(2)).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

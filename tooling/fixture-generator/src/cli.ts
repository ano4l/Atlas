import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { generateTwoFloorVenuePackage, syntheticVenueScenarios, type SyntheticVenueScenario } from "./index";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let outputPath: string | undefined;
  let scenario: SyntheticVenueScenario | undefined;
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (flag === "--") continue;
    const value = args[++index];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    if (flag === "--output" && outputPath === undefined) outputPath = value;
    else if (flag === "--scenario" && scenario === undefined && syntheticVenueScenarios.includes(value as SyntheticVenueScenario)) {
      scenario = value as SyntheticVenueScenario;
    } else {
      throw new Error(`Invalid option ${flag} ${value}. Scenarios: ${syntheticVenueScenarios.join(", ")}`);
    }
  }
  const json = `${JSON.stringify(generateTwoFloorVenuePackage(scenario), null, 2)}\n`;
  if (outputPath) {
    const absolutePath = resolve(outputPath);
    await writeFile(absolutePath, json, "utf8");
    process.stdout.write(`${absolutePath}\n`);
    return;
  }
  process.stdout.write(json);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});

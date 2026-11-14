const { readFile, writeFile } = require("node:fs/promises");
const qr = require("qrcode");
const { createConnectedVenue } = require("../src/map/connected-venue.ts");
const { encodeCheckpoint } = require("../src/map/checkpoint.ts");

function escapeHtml(value) {
  const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return value.replace(/[&<>"']/g, (char) => entities[char]);
}

async function renderCheckpointSheet(pkg) {
  const venue = createConnectedVenue(pkg);
  const cards = await Promise.all(venue.starts.map(async (start, index) => {
    const code = encodeCheckpoint(venue, start);
    const svg = await qr.toString(code, { type: "svg", errorCorrectionLevel: "M", margin: 4 });
    return `<article><h2>${escapeHtml(start.floorName)} · Entrance ${index + 1}</h2>${svg}</article>`;
  }));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Atlas navigation checkpoints</title>
<style>
  body { font: 16px system-ui, sans-serif; max-width: 48rem; margin: 2rem auto; padding: 0 1rem }
  main { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem }
  article { border: 1px solid #555; padding: 1rem; text-align: center; break-inside: avoid }
  h2 { margin: 0; font-size: 1rem }
  svg { width: 45mm; max-width: 100%; height: auto; display: block; margin: 0 auto }
</style>
</head>
<body>
<h1>${escapeHtml(venue.venueName)}</h1>
<p>Fictional navigation checkpoints · Map version ${escapeHtml(String(pkg.mapVersion.version))}</p>
<main>${cards.join("\n")}</main>
</body>
</html>
`;
}

module.exports = { renderCheckpointSheet };

if (require.main === module) {
  async function printCheckpoints() {
    const [, , input, output] = process.argv;
    if (!input || !output) throw new Error("Usage: pnpm --filter mobile checkpoints <map-package.json> <checkpoints.html>");
    const pkg = JSON.parse(await readFile(input, "utf8"));
    await writeFile(output, await renderCheckpointSheet(pkg), { flag: "wx" });
    console.log(`Checkpoint sheet saved to ${output}`);
  }

  printCheckpoints().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

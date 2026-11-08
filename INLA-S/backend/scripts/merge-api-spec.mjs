/**
 * Builds the single aggregated OpenAPI document at backend/api-spec.yaml from every
 * submodule openapi.yaml under backend/ (discovered automatically).
 *
 * Uses @redocly/cli `join` to merge paths/components without hand-copying module specs.
 * Component and tag names are prefixed with `info.title` per module to avoid collisions.
 *
 * Usage (from backend/): npm run api-spec:merge
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = join(__dirname, "..");

/** Stable merge order; any other openapi.yaml under backend/ is sorted after these. */
const PRIORITY_RELATIVE = ["users/openapi.yaml", "customer/openapi.yaml", "quotation/openapi.yaml"];

function* walkOpenApiFiles(dir) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === "node_modules") continue;
      yield* walkOpenApiFiles(full);
    } else if (name.name === "openapi.yaml") {
      yield full;
    }
  }
}

function normalizeSeparators(p) {
  return relative(BACKEND_ROOT, p).split("\\").join("/");
}

function sortSpecPaths(paths) {
  const relSet = new Set(paths.map(normalizeSeparators));
  const missing = PRIORITY_RELATIVE.filter((p) => !relSet.has(p));
  if (missing.length) {
    console.error("merge-api-spec: missing expected module specs:", missing.join(", "));
    process.exit(1);
  }
  const primary = PRIORITY_RELATIVE.map((p) => join(BACKEND_ROOT, ...p.split("/")));
  const extra = paths
    .filter((p) => !PRIORITY_RELATIVE.includes(normalizeSeparators(p)))
    .sort((a, b) => normalizeSeparators(a).localeCompare(normalizeSeparators(b)));
  return [...primary, ...extra];
}

function main() {
  const raw = [...walkOpenApiFiles(BACKEND_ROOT)];
  const candidates = raw.filter((p) => normalizeSeparators(p) !== "api-spec.yaml");
  if (candidates.length === 0) {
    console.error("merge-api-spec: no openapi.yaml files found under backend/");
    process.exit(1);
  }
  const ordered = sortSpecPaths(candidates);
  const outFile = join(BACKEND_ROOT, "api-spec.yaml");
  let redoclyCli;
  try {
    redoclyCli = require.resolve("@redocly/cli/bin/cli.js");
  } catch {
    console.error("merge-api-spec: @redocly/cli not found. Run npm install in backend/ first.");
    process.exit(1);
  }
  const args = [
    redoclyCli,
    "join",
    ...ordered.map((p) => relative(BACKEND_ROOT, p)),
    "-o",
    "api-spec.yaml",
    "--prefix-components-with-info-prop",
    "title",
    "--prefix-tags-with-info-prop",
    "title",
  ];
  execFileSync(process.execPath, args, { cwd: BACKEND_ROOT, stdio: "inherit" });
  console.log("merge-api-spec: wrote " + outFile + " (" + ordered.length + " modules)");
}

main();

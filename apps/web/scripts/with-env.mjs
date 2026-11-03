import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { parse } from "dotenv";

// next only reads .env from the app folder, but the workspace keeps one at the repo root
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.resolve(appDir, "../../.env");

if (existsSync(envFile)) {
  const parsed = parse(readFileSync(envFile));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const require = createRequire(import.meta.url);
const nextBin = path.join(path.dirname(require.resolve("next/package.json")), "dist/bin/next");

const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  cwd: appDir,
  stdio: "inherit",
  env: process.env,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});

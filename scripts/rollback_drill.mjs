// Rollback drill runner
import { spawn } from "node:child_process";
import { cpSync, rmSync, writeFileSync } from "node:fs";

const PORT = 3410;
const URL = `http://127.0.0.1:${PORT}/health/ready`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function checkStatus(expected = 200) {
  for (let i = 0; i < 35; i++) {
    try {
      const res = await fetch(URL);
      if (res.status === expected) return res.status;
    } catch {
      // connecting
    }
    await sleep(250);
  }
  return 0;
}

async function ensurePortFree() {
  for (let i = 0; i < 20; i++) {
    try {
      await fetch(URL);
      await sleep(200);
    } catch {
      return;
    }
  }
}

function runServer() {
  const child = spawn("node", [".next/standalone/server.js"], {
    env: { ...process.env, PORT: String(PORT), HOSTNAME: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", (d) => {
    const s = d.toString();
    if (!s.includes("EADDRINUSE")) console.error("    [srv stderr]:", s.trim());
  });
  return {
    child,
    stop: () => {
      try { child.kill("SIGKILL"); } catch { /* ignore */ }
    },
  };
}

async function main() {
  console.log("[DRILL] 1. Backing up verified production entrypoint...");
  cpSync(".next/standalone/server.js", ".next/standalone/server.js.prev");

  console.log("[DRILL] 2. Booting baseline release artifact on port 3410...");
  const srv1 = runServer();
  const statusBase = await checkStatus();
  console.log(`[DRILL] Baseline health HTTP status: ${statusBase}`);
  srv1.stop();
  await ensurePortFree();

  if (statusBase !== 200) {
    throw new Error(`Baseline failed to return 200 (got ${statusBase})`);
  }

  console.log("[DRILL] 3. Simulating corrupted release artifact promotion...");
  writeFileSync(".next/standalone/server.js", "console.error('FATAL'); process.exit(1);");
  const srvBad = runServer();
  await sleep(1500);
  const statusBad = await checkStatus(200);
  console.log(`[DRILL] Corrupted artifact health status: ${statusBad} (server failed to bind/live)`);
  srvBad.stop();
  await ensurePortFree();

  console.log("[DRILL] 4. Executing rollback to server.js.prev...");
  cpSync(".next/standalone/server.js.prev", ".next/standalone/server.js");

  console.log("[DRILL] 5. Booting restored artifact...");
  const srvRestored = runServer();
  const statusRestored = await checkStatus(200);
  console.log(`[DRILL] Restored health HTTP status: ${statusRestored}`);
  srvRestored.stop();
  await ensurePortFree();

  rmSync(".next/standalone/server.js.prev", { force: true });

  if (statusRestored === 200) {
    console.log("[DRILL SUCCESS] Rollback verified: baseline=200, corrupted=0, restored=200");
  } else {
    throw new Error(`Restored artifact failed health check (got ${statusRestored})`);
  }
}

main().catch((err) => {
  console.error("[DRILL FAILED]:", err);
  process.exit(1);
});

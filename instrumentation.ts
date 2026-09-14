export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const boot = {
    level: "info",
    event: "service.boot",
    service: "netlab",
    version: process.env.APP_VERSION ?? "dev",
    pid: process.env.NEXT_RUNTIME === "nodejs" ? process.pid : undefined,
    ts: new Date().toISOString(),
  };
  console.log(JSON.stringify(boot));
  // Periodic structured metrics line for log pipelines (RUNBOOK: active sessions, reconnects proxy metrics).
  const { classroomDiagnostics } = await import("@/lib/classroom/http");
  const timer = setInterval(() => {
    try {
      const diag = classroomDiagnostics();
      console.log(JSON.stringify({ level: "info", event: "metrics.classroom", ts: new Date().toISOString(), ...diag }));
    } catch {
      console.log(JSON.stringify({ level: "warn", event: "metrics.classroom.unavailable", ts: new Date().toISOString() }));
    }
  }, 30_000);
  timer.unref?.();
}

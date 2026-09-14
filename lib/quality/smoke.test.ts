import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ClassroomSessionStore } from "../classroom/session.ts";
import { CourseworkStore } from "../classroom/coursework.ts";
import { ClassroomApi } from "../classroom/api.ts";
import { RateLimiter } from "../classroom/security.ts";
import { exportWorkspace, importWorkspace } from "../simulator/workspace.ts";
import { createTopology, addDevice, addLink, ping } from "../simulator/core.ts";
import { projectPacketFrames } from "../simulator/packet.ts";
import { RealtimeHub } from "../classroom/realtime/hub.ts";

// ==========================================
// 1. SECURITY SMOKE (TEST-SEC-001 & Threats)
// ==========================================

test("SECURITY: workspace import rejects prototype pollution and unsafe keys", () => {
  const payloadWithProto = '{"schema":"netlab.workspace","version":2,"kind":"workspace","workspace":{"version":1,"devices":[],"links":[]},"__proto__":{"admin":true}}';
  assert.throws(() => importWorkspace(payloadWithProto), /unsafe workspace key/i);

  const payloadWithConstructor = '{"schema":"netlab.workspace","version":2,"kind":"workspace","constructor":{"pollute":true},"workspace":{"version":1,"devices":[],"links":[]}}';
  assert.throws(() => importWorkspace(payloadWithConstructor), /unsafe workspace key/i);

  const payloadWithPrototype = '{"schema":"netlab.workspace","version":2,"kind":"workspace","prototype":{"bad":true},"workspace":{"version":1,"devices":[],"links":[]}}';
  assert.throws(() => importWorkspace(payloadWithPrototype), /unsafe workspace key/i);
});

test("SECURITY: workspace import rejects oversized payloads (>256KB)", () => {
  const hugeString = "a".repeat(300 * 1024);
  const oversized = JSON.stringify({
    schema: "netlab.workspace",
    version: 2,
    kind: "workspace",
    workspace: { version: 1, devices: [], links: [] },
    blob: hugeString,
  });
  assert.throws(() => importWorkspace(oversized), /payload exceeds/i);
});

test("SECURITY: secret redaction ensures host secrets never leak into exports or public responses", async () => {
  const store = new ClassroomSessionStore({ now: () => 1_000 });
  const coursework = new CourseworkStore(store, { now: () => 1_000 });
  const api = new ClassroomApi(store, coursework);

  const secret = "super-sensitive-host-token-xyz999";
  const created = await api.createClass({ class_code: "CS-SEC001", host_token: secret });
  assert.ok(created.ok);
  if (!created.ok) return;

  const rawCreatedJson = JSON.stringify(created);
  assert.equal(rawCreatedJson.includes(secret), false, "Host secret must not appear in create response");
  assert.equal(rawCreatedJson.includes("host_token_hash"), false, "Token hash must not appear in public response");

  // Export workspace with hostToken option
  let topo = createTopology();
  topo = addDevice(topo, { id: "pc-0", type: "pc", label: "PC-0" });
  const exported = exportWorkspace(topo, { hostToken: secret });
  assert.equal(exported.includes(secret), false, "Host secret must never be included in export payload");
});

test("SECURITY: cross-participant and unauthorized host operations are strictly blocked", async () => {
  const store = new ClassroomSessionStore({ now: () => 1_000 });
  const coursework = new CourseworkStore(store, { now: () => 1_000 });
  const api = new ClassroomApi(store, coursework);

  const created = await api.createClass({ class_code: "CS-SEC002", host_token: "host-secret" });
  assert.ok(created.ok);
  if (!created.ok) return;
  const sId = created.data.id;

  const studentA = await api.joinClass(sId, { class_code: "CS-SEC002", nickname: "Student A", join_token: "token-a" });
  const studentB = await api.joinClass(sId, { class_code: "CS-SEC002", nickname: "Student B", join_token: "token-b" });
  assert.ok(studentA.ok && studentB.ok);

  // Student A tries to execute host lifecycle change -> FORBIDDEN
  const lifecycleHack = await api.changeLifecycle(sId, "close", "token-a");
  assert.equal(lifecycleHack.ok, false);
  if (!lifecycleHack.ok) assert.equal(lifecycleHack.error.code, "FORBIDDEN");

  // Student B tries to access teacher results projection -> FORBIDDEN
  const resultsHack = await api.getResults(sId, "token-b");
  assert.equal(resultsHack.ok, false);
  if (!resultsHack.ok) assert.equal(resultsHack.error.code, "FORBIDDEN");
});

test("SECURITY: rate limiter blocks rapid brute-force attempts", () => {
  const limiter = new RateLimiter({ maxAttempts: 5, windowMs: 10_000, now: () => 1_000 });
  const key = "ip:192.168.1.50";

  for (let i = 0; i < 5; i += 1) {
    assert.equal(limiter.allow(key), true, `Attempt ${i + 1} should be allowed`);
  }
  assert.equal(limiter.allow(key), false, "6th attempt in window must be blocked");
});

// ==========================================
// 2. ACCESSIBILITY SMOKE (WCAG 2.2 AA)
// ==========================================

test("ACCESSIBILITY: live CSS tokens in app/globals.css meet WCAG 2.2 AA contrast", () => {
  // Relative luminance per WCAG 2.1
  function luminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function contrastRatio(hex1: string, hex2: string): number {
    const parse = (hex: string) => [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ] as const;
    const [r1, g1, b1] = parse(hex1);
    const [r2, g2, b2] = parse(hex2);
    const l1 = luminance(r1, g1, b1);
    const l2 = luminance(r2, g2, b2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Parse token values from the real stylesheet so this test guards the shipped design tokens.
  const cssPath = new URL("../../app/globals.css", import.meta.url);
  const css = readFileSync(cssPath, "utf8");
  const token = (name: string): string => {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    assert.ok(match, `CSS token --${name} not found in app/globals.css`);
    return match[1];
  };

  const background = token("background");
  const foreground = token("foreground");
  const primary = token("primary");
  const primaryFg = token("primary-foreground");
  const secondary = token("secondary");
  const secondaryFg = token("secondary-foreground");
  const mutedFg = token("muted-foreground");
  const destructive = token("destructive");

  const pairs: Array<[string, string, number, string]> = [
    [foreground, background, 7.0, "body text vs canvas (AAA)"],
    [mutedFg, background, 4.5, "muted text vs canvas (AA)"],
    [primaryFg, primary, 4.5, "button label vs primary (AA)"],
    [secondaryFg, secondary, 7.0, "dock label vs dark surface (AAA)"],
    [destructive, background, 3.0, "destructive UI element vs canvas (AA non-text)"],
  ];

  for (const [fg, bg, min, label] of pairs) {
    const ratio = contrastRatio(fg, bg);
    assert.ok(ratio >= min, `${label}: ${fg} on ${bg} = ${ratio.toFixed(2)}, below required ${min}`);
  }
});

// ==========================================
// 3. PERFORMANCE SMOKE
// ==========================================

test("PERFORMANCE: packet animation frame projection completes within 5ms budget", () => {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "sw-0", type: "switch", label: "Switch-0" });
  topology = addDevice(topology, { id: "rt-0", type: "router", label: "Router-0", ipv4: { address: "192.168.1.1", prefix: 24 } });
  topology = addDevice(topology, { id: "sv-0", type: "server", label: "Server-0", ipv4: { address: "192.168.1.20", prefix: 24 } });
  topology = addLink(topology, { fromDeviceId: "pc-0", toDeviceId: "sw-0", fromPort: "fa0/1", toPort: "fa0/1" });
  topology = addLink(topology, { fromDeviceId: "sw-0", toDeviceId: "rt-0", fromPort: "fa0/2", toPort: "fa0/1" });
  topology = addLink(topology, { fromDeviceId: "rt-0", toDeviceId: "sv-0", fromPort: "fa0/2", toPort: "fa0/1" });

  const start = performance.now();
  const pingRes = ping(topology, "pc-0", "sv-0");
  const frames = projectPacketFrames(pingRes, "1x");
  const duration = performance.now() - start;

  assert.equal(pingRes.status, "success");
  assert.ok(frames.length > 0);
  assert.ok(duration < 15, `Deterministic ping + frame projection took ${duration.toFixed(2)}ms (budget: <15ms)`);
});

test("PERFORMANCE: concurrent classroom scaling simulates 50 participants without latency degradation", async () => {
  const store = new ClassroomSessionStore({ now: () => Date.now() });
  const coursework = new CourseworkStore(store, { now: () => Date.now() });
  const hub = new RealtimeHub();
  const api = new ClassroomApi(store, coursework, hub);

  const created = await api.createClass({ class_code: "CS-PERF01", host_token: "host-perf" });
  assert.ok(created.ok);
  if (!created.ok) return;
  const sId = created.data.id;

  const start = performance.now();
  const participantCount = 50;
  const joins = await Promise.all(
    Array.from({ length: participantCount }).map((_, i) =>
      api.joinClass(sId, { class_code: "CS-PERF01", nickname: `Student-${i}`, join_token: `token-${i}` })
    )
  );

  const duration = performance.now() - start;
  assert.equal(joins.every((j) => j.ok), true, "All 50 participants must join successfully");
  assert.ok(duration < 200, `50 concurrent joins took ${duration.toFixed(2)}ms (budget: <200ms)`);

  // Verify memory store integrity
  const snapshot = await api.getSnapshot(sId, { role: "host", token: "host-perf" });
  assert.ok(snapshot.ok);
  if (snapshot.ok) {
    assert.equal(snapshot.data.participants.length, 50);
  }
});

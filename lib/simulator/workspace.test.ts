import assert from "node:assert/strict";
import test from "node:test";
import { addDevice, addLink, createTopology, type Topology } from "./core.ts";
import { exportWorkspace, importWorkspace, type WorkspaceExport } from "./workspace.ts";

function sampleTopology(): Topology {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "switch-0", type: "switch", label: "Switch-0" });
  return addLink(topology, { id: "link-0", fromDeviceId: "pc-0", toDeviceId: "switch-0", fromPort: "fa0/1", toPort: "fa0/1" });
}

test("export/import round-trips a topology and strips host credentials", () => {
  const topology = sampleTopology();
  const json = exportWorkspace(topology, { exerciseRef: "exercise-01", hostToken: "secret-host-token" });
  const parsed = JSON.parse(json) as WorkspaceExport;

  assert.equal(parsed.schema, "netlab.workspace");
  assert.equal(parsed.kind, "workspace");
  assert.equal(parsed.exercise_ref, "exercise-01");
  assert.equal("hostToken" in parsed, false);
  assert.equal(json.includes("secret-host-token"), false);
  assert.deepEqual(importWorkspace(json), topology);
});

test("importWorkspace migrates supported legacy schema and reports the migration", () => {
  const legacy = JSON.stringify({ schema: "netlab.workspace", version: 1, kind: "workspace", workspace: sampleTopology() });
  const result = importWorkspace(legacy);
  assert.deepEqual(result, sampleTopology());
});

test("importWorkspace rejects unsupported versions with a migration message", () => {
  const unsupported = JSON.stringify({ schema: "netlab.workspace", version: 99, kind: "workspace", workspace: sampleTopology() });
  assert.throws(() => importWorkspace(unsupported), /migration required|unsupported schema version/i);
});

test("importWorkspace rejects malformed, oversized, and deeply nested payloads before mutation", () => {
  assert.throws(() => importWorkspace("not-json"), /invalid workspace JSON/i);
  assert.throws(() => importWorkspace(JSON.stringify({ schema: "other", version: 1, kind: "workspace", workspace: sampleTopology() })), /unsupported workspace schema/i);
  assert.throws(() => importWorkspace(JSON.stringify({ schema: "netlab.workspace", version: 2, kind: "workspace", workspace: { devices: [], links: [], version: 1 }, extra: "x".repeat(100) }), { maxBytes: 80 }), /workspace payload exceeds/i);
  const deeplyNested = `{"schema":"netlab.workspace","version":2,"kind":"workspace","workspace":${"{".repeat(40)}null${"}".repeat(40)}}`;
  assert.throws(() => importWorkspace(deeplyNested), /nested|invalid workspace/i);
});

test("importWorkspace rejects topology references that do not exist", () => {
  const invalid = JSON.stringify({ schema: "netlab.workspace", version: 2, kind: "workspace", workspace: { version: 1, devices: [], links: [{ id: "link-0", fromDeviceId: "missing", toDeviceId: "also-missing", fromPort: "fa0/1", toPort: "fa0/1", up: true }] } });
  assert.throws(() => importWorkspace(invalid), /endpoint|device/i);
});

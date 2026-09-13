import assert from "node:assert/strict";
import test from "node:test";
import { addDevice, addLink, createTopology, type Topology } from "./core.ts";
import { evaluateExercise, type Exercise } from "./exercise.ts";

function exerciseTopology(): Topology {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "switch-0", type: "switch", label: "Switch-0" });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Web Server", ipv4: { address: "192.168.1.20", prefix: 24 } });
  topology = addLink(topology, { id: "link-pc-switch", fromDeviceId: "pc-0", toDeviceId: "switch-0", fromPort: "fa0/1", toPort: "fa0/1" });
  return addLink(topology, { id: "link-switch-server", fromDeviceId: "switch-0", toDeviceId: "server-0", fromPort: "fa0/2", toPort: "eth0" });
}

const baseExercise: Exercise = {
  id: "exercise-01",
  version: 1,
  title: "Build a connected LAN",
  instructions: "Connect the PC to the web server.",
  targets: [
    { id: "target-device", type: "device_config", deviceId: "pc-0", address: "192.168.1.10", prefix: 24 },
    { id: "target-link", type: "link_exists", fromDeviceId: "pc-0", toDeviceId: "switch-0" },
    { id: "target-ping", type: "reachability", sourceDeviceId: "pc-0", destinationDeviceId: "server-0" },
    { id: "target-count", type: "required_device_count", deviceType: "pc", count: 1 },
  ],
};

test("evaluateExercise returns a deterministic perfect score when all targets pass", () => {
  const topology = exerciseTopology();
  const first = evaluateExercise(baseExercise, topology);
  const second = evaluateExercise(baseExercise, topology);

  assert.equal(first.status, "passed");
  assert.equal(first.score, 100);
  assert.equal(first.checks.every((check) => check.passed), true);
  assert.equal(first.evaluatedWorkspaceVersion, topology.version);
  assert.deepEqual(first, second);
});

test("evaluateExercise returns partial score and actionable feedback", () => {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.99", prefix: 24 } });
  topology = addDevice(topology, { id: "switch-0", type: "switch", label: "Switch-0" });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Web Server", ipv4: { address: "192.168.1.20", prefix: 24 } });

  const result = evaluateExercise(baseExercise, topology);
  assert.equal(result.status, "partial");
  assert.equal(result.score, 25);
  assert.equal(result.checks.filter((check) => check.passed).length, 1);
  assert.match(result.feedback, /1 of 4/i);
  assert.ok(result.checks.filter((check) => !check.passed).every((check) => check.reason.length > 0));
});

test("evaluateExercise rejects malformed exercises before evaluation", () => {
  const malformed = { ...baseExercise, targets: [] };
  assert.throws(() => evaluateExercise(malformed, exerciseTopology()), /at least one target/i);
});

test("evaluateExercise reports failed status when every target fails", () => {
  const topology = createTopology();

  const result = evaluateExercise(baseExercise, topology);
  assert.equal(result.status, "failed");
  assert.equal(result.score, 0);
  assert.match(result.feedback, /0 of 4/i);
});

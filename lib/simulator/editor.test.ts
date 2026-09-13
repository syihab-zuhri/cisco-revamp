import assert from "node:assert/strict";
import test from "node:test";
import { createTopology } from "./core.ts";
import { addWorkspaceDevice, createWorkspaceState, selectWorkspaceDevice, updateWorkspaceIPv4 } from "./editor.ts";

test("workspace editor adds and selects a device deterministically", () => {
  const initial = createWorkspaceState(createTopology());
  const withPc = addWorkspaceDevice(initial, "pc");
  const withSwitch = addWorkspaceDevice(withPc, "switch");

  assert.deepEqual(withPc.topology.devices.map((device) => device.id), ["pc-0"]);
  assert.equal(withPc.selectedDeviceId, "pc-0");
  assert.equal(withSwitch.selectedDeviceId, "switch-0");
  assert.equal(withSwitch.devices.find((device) => device.id === "switch-0")?.position.x, 43);
});

test("workspace editor updates IPv4 without changing topology links", () => {
  const initial = addWorkspaceDevice(createWorkspaceState(createTopology()), "pc");
  const updated = updateWorkspaceIPv4(initial, "pc-0", { address: "192.168.1.10", prefix: 24, gateway: "192.168.1.1" });

  assert.deepEqual(updated.devices[0].ipv4, { address: "192.168.1.10", prefix: 24, gateway: "192.168.1.1" });
  assert.equal(updated.topology.links.length, 0);
  assert.equal(updated.topology.version, initial.topology.version);
});

test("workspace editor ignores unknown selections", () => {
  const initial = addWorkspaceDevice(createWorkspaceState(createTopology()), "router");
  assert.equal(selectWorkspaceDevice(initial, "missing").selectedDeviceId, "router-0");
});

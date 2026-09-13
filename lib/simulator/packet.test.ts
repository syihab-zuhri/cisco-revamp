import assert from "node:assert/strict";
import test from "node:test";
import { createTopology, addDevice, addLink, ping } from "./core.ts";
import { packetProjectionSignature, projectPacketFrames, speedFactor } from "./packet.ts";

function connectedFixture() {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "switch-0", type: "switch", label: "Switch-0" });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Server-0", ipv4: { address: "192.168.1.20", prefix: 24 } });
  topology = addLink(topology, { fromDeviceId: "pc-0", toDeviceId: "switch-0", fromPort: "fa0/1", toPort: "fa0/1" });
  topology = addLink(topology, { fromDeviceId: "switch-0", toDeviceId: "server-0", fromPort: "fa0/2", toPort: "fa0/1" });
  return topology;
}

test("packet frames preserve event order and ping result signature", () => {
  const result = ping(connectedFixture(), "pc-0", "server-0");
  const frames = projectPacketFrames(result, "1x");
  assert.equal(frames.length, result.events.length);
  assert.deepEqual(frames.map((frame) => frame.event.sequence), result.events.map((event) => event.sequence));
  assert.equal(frames[0].progress, 0);
  assert.equal(frames.at(-1)?.progress, 1);
  assert.equal(packetProjectionSignature(result), "success:6:1:pc-0:depart|2:pc-0:arrive|3:switch-0:depart|4:switch-0:arrive|5:server-0:depart|6:server-0:arrive");
});

test("speed changes timing only, never event order or result", () => {
  const result = ping(connectedFixture(), "pc-0", "server-0");
  const slow = projectPacketFrames(result, "0.5x");
  const fast = projectPacketFrames(result, "2x");
  assert.equal(speedFactor("0.5x"), 2);
  assert.equal(speedFactor("2x"), 0.5);
  assert.deepEqual(slow.map((frame) => frame.event), fast.map((frame) => frame.event));
  assert.ok((slow[1].elapsedMs ?? 0) > (fast[1].elapsedMs ?? 0));
  assert.equal(packetProjectionSignature(result), packetProjectionSignature(result));
});

test("failed ping still projects a single drop frame", () => {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0" });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Server-0" });
  const result = ping(topology, "pc-0", "server-0");
  const frames = projectPacketFrames(result);
  assert.equal(result.status, "failed");
  assert.equal(frames.length, 1);
  assert.equal(frames[0].event.kind, "drop");
  assert.equal(frames[0].progress, 1);
});

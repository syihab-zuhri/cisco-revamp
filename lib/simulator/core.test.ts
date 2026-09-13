import assert from "node:assert/strict";
import test from "node:test";
import { addDevice, addLink, createTopology, ping, type Topology } from "./core.ts";

function connectedTopology(): Topology {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "switch-0", type: "switch", label: "Switch-0" });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Web Server", ipv4: { address: "192.168.1.20", prefix: 24 } });
  topology = addLink(topology, { id: "link-pc-switch", fromDeviceId: "pc-0", toDeviceId: "switch-0", fromPort: "fa0/1", toPort: "fa0/1" });
  return addLink(topology, { id: "link-switch-server", fromDeviceId: "switch-0", toDeviceId: "server-0", fromPort: "fa0/2", toPort: "eth0" });
}

test("ping returns deterministic success events for a connected LAN", () => {
  const topology = connectedTopology();
  const first = ping(topology, "pc-0", "server-0");
  const second = ping(topology, "pc-0", "server-0");

  assert.equal(first.status, "success");
  assert.deepEqual(first.hops, ["pc-0", "switch-0", "server-0"]);
  assert.equal(first.events.length, 6);
  assert.deepEqual(first, second);
});

test("ping fails with an actionable reason when no route exists", () => {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Web Server", ipv4: { address: "192.168.1.20", prefix: 24 } });

  const result = ping(topology, "pc-0", "server-0");
  assert.equal(result.status, "failed");
  assert.equal(result.reason, "No route to host");
  assert.equal(result.events[0].kind, "drop");
});

test("ping rejects cross-subnet traffic without a gateway", () => {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Web Server", ipv4: { address: "10.0.0.20", prefix: 24 } });
  topology = addLink(topology, { fromDeviceId: "pc-0", toDeviceId: "server-0", fromPort: "fa0/1", toPort: "eth0" });

  const result = ping(topology, "pc-0", "server-0");
  assert.equal(result.status, "failed");
  assert.match(result.reason, /no gateway/i);
});

test("topology mutations increment version and reject duplicate links", () => {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0" });
  topology = addDevice(topology, { id: "switch-0", type: "switch", label: "Switch-0" });
  const beforeLink = topology.version;
  topology = addLink(topology, { fromDeviceId: "pc-0", toDeviceId: "switch-0", fromPort: "fa0/1", toPort: "fa0/1" });
  assert.equal(topology.version, beforeLink + 1);
  assert.throws(() => addLink(topology, { fromDeviceId: "switch-0", toDeviceId: "pc-0", fromPort: "fa0/1", toPort: "fa0/1" }), /already exists/);
});

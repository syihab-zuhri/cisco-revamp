export type DeviceType = "pc" | "switch" | "router" | "server" | "access_point";
export type PacketStatus = "success" | "failed";

export type IPv4Config = {
  address: string;
  prefix: number;
  gateway?: string;
};

export type Device = {
  id: string;
  type: DeviceType;
  label: string;
  ipv4?: IPv4Config;
};

export type Link = {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  fromPort: string;
  toPort: string;
  up: boolean;
};

export type Topology = {
  version: number;
  devices: Device[];
  links: Link[];
};

export type PacketEvent = {
  sequence: number;
  deviceId: string;
  label: string;
  kind: "depart" | "arrive" | "drop";
  detail: string;
};

export type PingResult = {
  status: PacketStatus;
  sourceDeviceId: string;
  destinationDeviceId: string;
  hops: string[];
  events: PacketEvent[];
  reason: string;
  topologyVersion: number;
};

const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;

export function parseIPv4(address: string): number[] {
  if (!IPV4_PATTERN.test(address)) throw new Error(`Invalid IPv4 address: ${address}`);
  const octets = address.split(".").map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) {
    throw new Error(`Invalid IPv4 address: ${address}`);
  }
  return octets;
}

export function sameSubnet(left: IPv4Config, right: IPv4Config): boolean {
  if (left.prefix !== right.prefix || left.prefix < 0 || left.prefix > 32) return false;
  const leftNumber = ipv4ToNumber(left.address);
  const rightNumber = ipv4ToNumber(right.address);
  const mask = left.prefix === 0 ? 0 : (0xffffffff << (32 - left.prefix)) >>> 0;
  return (leftNumber & mask) === (rightNumber & mask);
}

export function ipv4ToNumber(address: string): number {
  return parseIPv4(address).reduce((value, octet) => ((value << 8) | octet) >>> 0, 0);
}

export function createTopology(): Topology {
  return { version: 1, devices: [], links: [] };
}

export function addDevice(topology: Topology, device: Omit<Device, "id"> & { id?: string }): Topology {
  const id = device.id ?? `${device.type}-${topology.devices.filter((item) => item.type === device.type).length}`;
  if (topology.devices.some((item) => item.id === id)) throw new Error(`Device already exists: ${id}`);
  return { ...topology, version: topology.version + 1, devices: [...topology.devices, { ...device, id }] };
}

export function addLink(topology: Topology, link: Omit<Link, "id" | "up"> & { id?: string; up?: boolean }): Topology {
  const from = topology.devices.find((device) => device.id === link.fromDeviceId);
  const to = topology.devices.find((device) => device.id === link.toDeviceId);
  if (!from || !to) throw new Error("Link endpoints must reference existing devices");
  if (link.fromDeviceId === link.toDeviceId) throw new Error("A device cannot link to itself");
  const duplicate = topology.links.some((item) =>
    (item.fromDeviceId === link.fromDeviceId && item.toDeviceId === link.toDeviceId) ||
    (item.fromDeviceId === link.toDeviceId && item.toDeviceId === link.fromDeviceId),
  );
  if (duplicate) throw new Error("Link already exists between these devices");
  const id = link.id ?? `link-${topology.links.length}`;
  return { ...topology, version: topology.version + 1, links: [...topology.links, { ...link, id, up: link.up ?? true }] };
}

function neighbours(topology: Topology, deviceId: string): string[] {
  return topology.links.filter((link) => link.up && (link.fromDeviceId === deviceId || link.toDeviceId === deviceId)).map((link) =>
    link.fromDeviceId === deviceId ? link.toDeviceId : link.fromDeviceId,
  );
}

function findRoute(topology: Topology, sourceId: string, destinationId: string): string[] | null {
  const queue: string[][] = [[sourceId]];
  const visited = new Set([sourceId]);
  while (queue.length) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    if (current === destinationId) return path;
    for (const next of neighbours(topology, current)) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return null;
}

export function ping(topology: Topology, sourceId: string, destinationId: string): PingResult {
  const source = topology.devices.find((device) => device.id === sourceId);
  const destination = topology.devices.find((device) => device.id === destinationId);
  if (!source || !destination) throw new Error("Ping endpoints must reference existing devices");
  if (!source.ipv4 || !destination.ipv4) return failedPing(topology, source, destination, "Source and destination require IPv4 configuration");

  const route = findRoute(topology, sourceId, destinationId);
  if (!route) return failedPing(topology, source, destination, "No route to host");
  if (!sameSubnet(source.ipv4, destination.ipv4) && !source.ipv4.gateway) {
    return failedPing(topology, source, destination, "Destination is outside the source subnet and no gateway is configured");
  }

  const events: PacketEvent[] = [];
  route.forEach((deviceId, index) => {
    const device = topology.devices.find((item) => item.id === deviceId)!;
    events.push({ sequence: index * 2 + 1, deviceId, label: device.label, kind: "depart", detail: `ICMP request leaves ${device.label}` });
    events.push({ sequence: index * 2 + 2, deviceId, label: device.label, kind: "arrive", detail: `ICMP request reaches ${device.label}` });
  });
  return { status: "success", sourceDeviceId: sourceId, destinationDeviceId: destinationId, hops: route, events, reason: "ICMP echo reply received", topologyVersion: topology.version };
}

function failedPing(topology: Topology, source: Device, destination: Device, reason: string): PingResult {
  const events: PacketEvent[] = [{ sequence: 1, deviceId: source.id, label: source.label, kind: "drop", detail: reason }];
  return { status: "failed", sourceDeviceId: source.id, destinationDeviceId: destination.id, hops: [source.id], events, reason, topologyVersion: topology.version };
}

import type { Device, Link, Topology } from "./core.ts";

export const CURRENT_WORKSPACE_VERSION = 2;
export const WORKSPACE_SCHEMA = "netlab.workspace";
const DEFAULT_MAX_BYTES = 256 * 1024;
const MAX_DEPTH = 32;

export type WorkspaceExport = {
  schema: typeof WORKSPACE_SCHEMA;
  version: number;
  kind: "workspace";
  created_at: string;
  workspace: Topology;
  exercise_ref?: string;
};

type ImportOptions = { maxBytes?: number };
type UnknownRecord = Record<string, unknown>;

export function exportWorkspace(
  topology: Topology,
  options: { exerciseRef?: string; hostToken?: string } = {},
): string {
  validateTopology(topology);
  const payload: WorkspaceExport = {
    schema: WORKSPACE_SCHEMA,
    version: CURRENT_WORKSPACE_VERSION,
    kind: "workspace",
    created_at: new Date().toISOString(),
    workspace: topology,
  };
  if (options.exerciseRef) payload.exercise_ref = options.exerciseRef;
  // hostToken is intentionally accepted only to make accidental callers explicit;
  // it is never copied into the export payload.
  void options.hostToken;
  return JSON.stringify(payload);
}

export function importWorkspace(input: string, options: ImportOptions = {}): Topology {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const byteLength = Buffer.byteLength(input, "utf8");
  if (byteLength > maxBytes) throw new Error(`Workspace payload exceeds ${maxBytes} bytes`);

  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    throw new Error("Invalid workspace JSON");
  }
  assertSafeDepth(value, 0);
  if (!isRecord(value)) throw new Error("Invalid workspace payload");
  if (value.schema !== WORKSPACE_SCHEMA) throw new Error("Unsupported workspace schema; migration required");
  if (value.kind !== "workspace") throw new Error("Unsupported workspace kind");
  if (value.version !== 1 && value.version !== CURRENT_WORKSPACE_VERSION) {
    throw new Error(`Unsupported schema version ${String(value.version)}; migration required`);
  }
  if (!isRecord(value.workspace)) throw new Error("Invalid workspace object");

  const topology = migrateTopology(value.workspace, value.version as number);
  validateTopology(topology);
  return topology;
}

function migrateTopology(raw: UnknownRecord, version: number): Topology {
  if (version === 1) {
    return {
      version: readInteger(raw.version, "workspace version"),
      devices: Array.isArray(raw.devices) ? raw.devices.map((device) => migrateDevice(device)) : [],
      links: Array.isArray(raw.links) ? raw.links.map((link) => migrateLink(link)) : [],
    };
  }
  return {
    version: readInteger(raw.version, "workspace version"),
    devices: Array.isArray(raw.devices) ? raw.devices.map((device) => readDevice(device)) : [],
    links: Array.isArray(raw.links) ? raw.links.map((link) => readLink(link)) : [],
  };
}

function migrateDevice(value: unknown): Device {
  const device = readRecord(value, "device");
  // v1 used `ip` and `mask` fields. Normalize them without preserving unknown data.
  const ipv4 = isRecord(device.ipv4)
    ? device.ipv4
    : typeof device.ip === "string"
      ? { address: device.ip, prefix: typeof device.prefix === "number" ? device.prefix : maskToPrefix(device.mask) }
      : undefined;
  return readDevice({ ...device, ipv4 });
}

function migrateLink(value: unknown): Link {
  return readLink(value);
}

function readDevice(value: unknown): Device {
  const device = readRecord(value, "device");
  if (typeof device.id !== "string" || typeof device.type !== "string" || typeof device.label !== "string") {
    throw new Error("Invalid device fields");
  }
  const result: Device = { id: device.id, type: device.type as Device["type"], label: device.label };
  if (device.ipv4 !== undefined) {
    const ipv4 = readRecord(device.ipv4, "IPv4 configuration");
    if (typeof ipv4.address !== "string" || typeof ipv4.prefix !== "number" || !Number.isInteger(ipv4.prefix)) throw new Error("Invalid IPv4 configuration");
    result.ipv4 = { address: ipv4.address, prefix: ipv4.prefix, ...(typeof ipv4.gateway === "string" ? { gateway: ipv4.gateway } : {}) };
  }
  return result;
}

function readLink(value: unknown): Link {
  const link = readRecord(value, "link");
  if ([link.id, link.fromDeviceId, link.toDeviceId, link.fromPort, link.toPort].some((item) => typeof item !== "string")) {
    throw new Error("Invalid link fields");
  }
  return { id: link.id as string, fromDeviceId: link.fromDeviceId as string, toDeviceId: link.toDeviceId as string, fromPort: link.fromPort as string, toPort: link.toPort as string, up: link.up !== false };
}

function validateTopology(topology: Topology): void {
  if (!topology || !Number.isInteger(topology.version) || topology.version < 1 || !Array.isArray(topology.devices) || !Array.isArray(topology.links)) {
    throw new Error("Invalid topology");
  }
  const ids = new Set<string>();
  for (const device of topology.devices) {
    if (!device.id || ids.has(device.id)) throw new Error("Device ids must be unique");
    ids.add(device.id);
  }
  const linkIds = new Set<string>();
  for (const link of topology.links) {
    if (linkIds.has(link.id)) throw new Error("Link ids must be unique");
    if (!ids.has(link.fromDeviceId) || !ids.has(link.toDeviceId)) throw new Error("Link endpoints must reference existing devices");
    linkIds.add(link.id);
  }
}

function assertSafeDepth(value: unknown, depth: number): void {
  if (depth > MAX_DEPTH) throw new Error("Workspace payload is too deeply nested");
  if (Array.isArray(value)) return value.forEach((item) => assertSafeDepth(item, depth + 1));
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (key === "__proto__" || key === "prototype" || key === "constructor") throw new Error("Unsafe workspace key");
      assertSafeDepth(item, depth + 1);
    }
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown, label: string): UnknownRecord {
  if (!isRecord(value)) throw new Error(`Invalid ${label}`);
  return value;
}

function readInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 1) throw new Error(`Invalid ${label}`);
  return value as number;
}

function maskToPrefix(mask: unknown): number {
  if (typeof mask !== "string") throw new Error("Invalid legacy subnet mask");
  const bits = mask.split(".").map(Number).map((octet) => octet.toString(2).padStart(8, "0")).join("");
  if (!/^1*0*$/.test(bits)) throw new Error("Invalid legacy subnet mask");
  return bits.indexOf("0") === -1 ? 32 : bits.indexOf("0");
}

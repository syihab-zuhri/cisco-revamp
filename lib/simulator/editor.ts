import { addDevice, type Device, type DeviceType, type IPv4Config, type Topology } from "./core.ts";

export type CanvasPosition = { x: number; y: number };

export type WorkspaceDevice = Device & { position: CanvasPosition };

export type WorkspaceState = {
  topology: Topology;
  devices: WorkspaceDevice[];
  selectedDeviceId?: string;
};

const positions: Record<DeviceType, CanvasPosition> = {
  pc: { x: 18, y: 28 },
  switch: { x: 43, y: 50 },
  router: { x: 68, y: 28 },
  server: { x: 82, y: 67 },
  access_point: { x: 57, y: 72 },
};

const labels: Record<DeviceType, string> = {
  pc: "PC",
  switch: "Switch",
  router: "Router",
  server: "Server",
  access_point: "Access Point",
};

export function createWorkspaceState(topology: Topology): WorkspaceState {
  return {
    topology,
    devices: topology.devices.map((device, index) => ({
      ...device,
      position: positions[device.type] ?? { x: 20 + index * 12, y: 30 + index * 8 },
    })),
    selectedDeviceId: topology.devices[0]?.id,
  };
}

export function addWorkspaceDevice(state: WorkspaceState, type: DeviceType): WorkspaceState {
  const nextTopology = addDevice(state.topology, { type, label: `${labels[type]}-${state.topology.devices.filter((device) => device.type === type).length}` });
  const added = nextTopology.devices[nextTopology.devices.length - 1];
  const sameTypeCount = state.devices.filter((device) => device.type === type).length;
  const base = positions[type];
  const device: WorkspaceDevice = {
    ...added,
    position: { x: Math.min(88, base.x + sameTypeCount * 5), y: Math.min(84, base.y + sameTypeCount * 5) },
  };
  return { topology: nextTopology, devices: [...state.devices, device], selectedDeviceId: device.id };
}

export function updateWorkspaceIPv4(state: WorkspaceState, deviceId: string, ipv4: IPv4Config | undefined): WorkspaceState {
  const devices = state.devices.map((device) => device.id === deviceId ? { ...device, ipv4 } : device);
  return {
    ...state,
    devices,
    topology: { ...state.topology, devices: devices.map((device) => ({ id: device.id, type: device.type, label: device.label, ...(device.ipv4 ? { ipv4: device.ipv4 } : {}) })) },
  };
}

export function selectWorkspaceDevice(state: WorkspaceState, deviceId: string): WorkspaceState {
  if (!state.devices.some((device) => device.id === deviceId)) return state;
  return { ...state, selectedDeviceId: deviceId };
}

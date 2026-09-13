import type { PacketEvent, PingResult } from "./core.ts";

export type PacketSpeed = "0.5x" | "1x" | "2x";

export type PacketFrame = {
  event: PacketEvent;
  elapsedMs: number;
  progress: number;
};

const speedFactors: Record<PacketSpeed, number> = {
  "0.5x": 2,
  "1x": 1,
  "2x": 0.5,
};

export function speedFactor(speed: PacketSpeed): number {
  return speedFactors[speed];
}

export function projectPacketFrames(result: PingResult, speed: PacketSpeed = "1x", eventDurationMs = 700): PacketFrame[] {
  const duration = Math.max(1, Math.round(eventDurationMs * speedFactor(speed)));
  return result.events.map((event, index) => ({
    event,
    elapsedMs: index * duration,
    progress: result.events.length <= 1 ? 1 : index / (result.events.length - 1),
  }));
}

export function packetProjectionSignature(result: PingResult): string {
  return `${result.status}:${result.topologyVersion}:${result.events.map((event) => `${event.sequence}:${event.deviceId}:${event.kind}`).join("|")}`;
}

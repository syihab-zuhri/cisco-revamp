import { ping, type DeviceType, type Topology } from "./core.ts";

export type ExerciseTarget =
  | { id: string; type: "device_config"; deviceId: string; address: string; prefix: number }
  | { id: string; type: "link_exists"; fromDeviceId: string; toDeviceId: string }
  | { id: string; type: "reachability"; sourceDeviceId: string; destinationDeviceId: string }
  | { id: string; type: "required_device_count"; deviceType: DeviceType; count: number };

export type Exercise = {
  id: string;
  version: number;
  title: string;
  instructions: string;
  targets: ExerciseTarget[];
};

export type ExerciseCheck = {
  targetId: string;
  passed: boolean;
  reason: string;
};

export type ExerciseEvaluation = {
  status: "passed" | "partial" | "failed";
  score: number;
  checks: ExerciseCheck[];
  feedback: string;
  evaluatedWorkspaceVersion: number;
  evaluatedAt: string;
};

export function evaluateExercise(exercise: Exercise, topology: Topology): ExerciseEvaluation {
  validateExercise(exercise);
  const checks = exercise.targets.map((target) => evaluateTarget(target, topology));
  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const status = passedCount === checks.length ? "passed" : passedCount === 0 ? "failed" : "partial";
  return {
    status,
    score,
    checks,
    feedback: `${passedCount} of ${checks.length} targets passed.`,
    evaluatedWorkspaceVersion: topology.version,
    evaluatedAt: new Date(0).toISOString(),
  };
}

function validateExercise(exercise: Exercise): void {
  if (!exercise.id || !exercise.title) throw new Error("Exercise requires id and title");
  if (!Number.isInteger(exercise.version) || exercise.version < 1) throw new Error("Exercise version must be a positive integer");
  if (!exercise.targets.length) throw new Error("Exercise requires at least one target");
  const ids = new Set<string>();
  for (const target of exercise.targets) {
    if (!target.id || ids.has(target.id)) throw new Error("Exercise target ids must be unique and non-empty");
    ids.add(target.id);
  }
}

function evaluateTarget(target: ExerciseTarget, topology: Topology): ExerciseCheck {
  switch (target.type) {
    case "device_config": {
      const device = topology.devices.find((item) => item.id === target.deviceId);
      const passed = device?.ipv4?.address === target.address && device.ipv4.prefix === target.prefix;
      return { targetId: target.id, passed, reason: passed ? "IPv4 configuration matches target" : `Configure ${target.deviceId} to ${target.address}/${target.prefix}` };
    }
    case "link_exists": {
      const passed = topology.links.some((link) => link.up && ((link.fromDeviceId === target.fromDeviceId && link.toDeviceId === target.toDeviceId) || (link.fromDeviceId === target.toDeviceId && link.toDeviceId === target.fromDeviceId)));
      return { targetId: target.id, passed, reason: passed ? "Required link is active" : `Connect ${target.fromDeviceId} to ${target.toDeviceId}` };
    }
    case "reachability": {
      const result = safePing(topology, target.sourceDeviceId, target.destinationDeviceId);
      const passed = result?.status === "success";
      return { targetId: target.id, passed, reason: passed ? "Destination is reachable" : result?.reason ?? "Ping endpoints are invalid" };
    }
    case "required_device_count": {
      const actual = topology.devices.filter((device) => device.type === target.deviceType).length;
      const passed = actual === target.count;
      return { targetId: target.id, passed, reason: passed ? `Required ${target.deviceType} count is ${target.count}` : `Add or remove ${target.deviceType} devices until count is ${target.count} (current: ${actual})` };
    }
  }
}

function safePing(topology: Topology, sourceId: string, destinationId: string) {
  try {
    return ping(topology, sourceId, destinationId);
  } catch {
    return null;
  }
}

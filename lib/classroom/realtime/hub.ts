export const REALTIME_EVENT_BUFFER = 64;

export type RealtimeEventType =
  | "session_snapshot"
  | "participant_joined"
  | "participant_presence_changed"
  | "exercise_started"
  | "exercise_locked"
  | "workspace_projection_updated"
  | "submission_evaluated"
  | "host_disconnected"
  | "session_closed"
  | "error";

export type RealtimeEvent = {
  type: RealtimeEventType;
  session_id: string;
  sequence: number;
  request_id: string;
  payload: Record<string, unknown>;
};

export type SnapshotPayload = {
  status: string;
  participants: Array<{ id: string; nickname: string; status: string }>;
  expires_at?: number;
};

type Listener = (event: RealtimeEvent) => void;

export class RealtimeHub {
  private readonly sessions = new Map<string, { sequence: number; events: RealtimeEvent[]; listeners: Set<Listener> }>();
  private readonly now: () => number;

  constructor(options: { now?: () => number } = {}) {
    this.now = options.now ?? (() => Date.now());
  }

  publish(sessionId: string, event: { type: RealtimeEventType; payload: Record<string, unknown>; request_id?: string }): RealtimeEvent {
    const state = this.ensureSession(sessionId);
    state.sequence += 1;
    const published: RealtimeEvent = {
      type: event.type,
      session_id: sessionId,
      sequence: state.sequence,
      request_id: event.request_id ?? `evt_${state.sequence}`,
      payload: event.payload,
    };
    state.events.push(published);
    if (state.events.length > REALTIME_EVENT_BUFFER) state.events.shift();
    for (const listener of state.listeners) listener(published);
    return published;
  }

  snapshot(sessionId: string, data: SnapshotPayload): RealtimeEvent {
    const state = this.ensureSession(sessionId);
    return {
      type: "session_snapshot",
      session_id: sessionId,
      sequence: state.sequence,
      request_id: `snap_${state.sequence}_${this.now()}`,
      payload: { ...data },
    };
  }

  eventsSince(sessionId: string, lastSeenSequence: number): { ok: true; events: RealtimeEvent[] } | { ok: false; reason: "gap" } {
    const state = this.sessions.get(sessionId);
    if (!state) return { ok: true, events: [] };
    const expectedOldest = lastSeenSequence + 1;
    const oldestBuffered = state.events[0]?.sequence ?? state.sequence + 1;
    if (expectedOldest < oldestBuffered) return { ok: false, reason: "gap" };
    return { ok: true, events: state.events.filter((event) => event.sequence > lastSeenSequence) };
  }

  subscribe(sessionId: string, listener: Listener): () => void {
    const state = this.ensureSession(sessionId);
    state.listeners.add(listener);
    return () => {
      state.listeners.delete(listener);
    };
  }

  private ensureSession(sessionId: string) {
    let state = this.sessions.get(sessionId);
    if (!state) {
      state = { sequence: 0, events: [], listeners: new Set() };
      this.sessions.set(sessionId, state);
    }
    return state;
  }
}

const hubKey = Symbol.for("netlab.classroom.realtime.hub");
type HubGlobal = typeof globalThis & { [hubKey]?: RealtimeHub };

export function realtimeHub(): RealtimeHub {
  const globalHub = globalThis as HubGlobal;
  if (!globalHub[hubKey]) globalHub[hubKey] = new RealtimeHub();
  return globalHub[hubKey] as RealtimeHub;
}

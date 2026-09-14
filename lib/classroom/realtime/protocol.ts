import { ClassroomApi, type Actor } from "../api.ts";
import { realtimeHub, RealtimeHub, type RealtimeEvent, type RealtimeEventType } from "./hub.ts";

export type ClientCommand =
  | { type: "subscribe"; session_id: string; role: Actor["role"]; token: string }
  | { type: "unsubscribe"; session_id: string; role: Actor["role"]; token: string }
  | { type: "heartbeat"; session_id: string; role: Actor["role"]; token: string }
  | { type: "reconcile"; session_id: string; role: Actor["role"]; token: string; last_seen_sequence: number }
  | { type: "lifecycle_change"; session_id: string; role: Actor["role"]; token: string; action: "close" | "disconnect" | "reconnect" }
  | { type: "workspace_changed"; session_id: string; role: Actor["role"]; token: string; payload: string; expected_version?: number };

export type ServerMessage =
  | RealtimeEvent
  | { type: "heartbeat_ack"; session_id: string; sequence: number; request_id: string; payload: { server_time: number } }
  | { type: "lifecycle_ack"; session_id: string; sequence: number; request_id: string; payload: { status: string } }
  | { type: "workspace_ack"; session_id: string; sequence: number; request_id: string; payload: { version: number } }
  | { type: "unsubscribe_ack"; session_id: string; sequence: number; request_id: string; payload: Record<string, never> }
  | { type: "error"; session_id: string; sequence: number; request_id: string; payload: { code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT"; message: string } };

export class RealtimeProtocol {
  private readonly api: ClassroomApi;
  private readonly hub: RealtimeHub;
  private readonly subscriptions = new Map<string, Set<(event: RealtimeEvent) => void>>();
  private readonly now: () => number;

  constructor(api: ClassroomApi, hub: RealtimeHub = realtimeHub(), options: { now?: () => number } = {}) {
    this.api = api;
    this.hub = hub;
    this.now = options.now ?? (() => Date.now());
  }

  /**
   * Transport-agnostic command handler. The WebSocket/SSE layer parses a JSON
   * client message into a ClientCommand, calls this, and forwards every
   * returned ServerMessage to the connection plus any events delivered later
   * via the subscriber registered on `subscribe`.
   */
  handleCommand(command: ClientCommand): ServerMessage[] {
    const actor: Actor = { role: command.role, token: command.token };
    if (!this.api.isAuthorized(command.session_id, actor)) {
      return [this.error(command.session_id, "FORBIDDEN", "Not authorized for this session")];
    }

    switch (command.type) {
      case "subscribe":
        return [this.snapshotMessage(command.session_id)];
      case "unsubscribe":
        return [this.ack(command.session_id, "unsubscribe_ack", {} as Record<string, never>)];
      case "heartbeat":
        return this.handleHeartbeat(command.session_id, command.role, command.token);
      case "reconcile":
        return this.handleReconcile(command.session_id, command.last_seen_sequence);
      case "lifecycle_change":
        return this.handleLifecycle(command.session_id, command.action, command.token);
      case "workspace_changed":
        return this.handleWorkspaceChanged(command.session_id, command.payload, command.token, command.expected_version);
    }
  }

  registerSubscriber(sessionId: string, listener: (event: RealtimeEvent) => void): () => void {
    const set = this.subscriptions.get(sessionId) ?? new Set();
    set.add(listener);
    this.subscriptions.set(sessionId, set);
    const removeHub = this.hub.subscribe(sessionId, listener);
    return () => {
      set.delete(listener);
      removeHub();
    };
  }

  private handleHeartbeat(sessionId: string, role: Actor["role"], token: string): ServerMessage[] {
    if (role === "participant") this.api.touchParticipant(sessionId, token);
    return [this.ack(sessionId, "heartbeat_ack", { server_time: this.now() })];
  }

  private handleReconcile(sessionId: string, lastSeenSequence: number): ServerMessage[] {
    const replay = this.hub.eventsSince(sessionId, lastSeenSequence);
    const snapshot = this.snapshotMessage(sessionId);
    if (!replay.ok || replay.events.length === 0) {
      return [{ ...snapshot, payload: { ...snapshot.payload, reconciled: "snapshot" } }];
    }
    return [snapshot, ...replay.events];
  }

  private handleLifecycle(sessionId: string, action: "close" | "disconnect" | "reconnect", token: string): ServerMessage[] {
    const result = this.api.changeLifecycleSync(sessionId, action, token);
    if (!result.ok) return [this.error(sessionId, result.error.code === "NOT_FOUND" ? "NOT_FOUND" : "CONFLICT", result.error.message)];
    return [this.ack(sessionId, "lifecycle_ack", { status: result.data.status })];
  }

  private handleWorkspaceChanged(sessionId: string, payload: string, token: string, expectedVersion?: number): ServerMessage[] {
    const result = this.api.saveParticipantWorkspaceSync(sessionId, payload, token, expectedVersion);
    if (!result.ok) {
      const code = result.error.code === "FORBIDDEN" ? "FORBIDDEN" : result.error.code === "CONFLICT" ? "CONFLICT" : "NOT_FOUND";
      return [this.error(sessionId, code, result.error.message)];
    }
    return [this.ack(sessionId, "workspace_ack", { version: result.data.topology.version })];
  }

  private snapshotMessage(sessionId: string): RealtimeEvent {
    const snapshot = this.api.snapshotData(sessionId);
    if (!snapshot) {
      return {
        type: "error",
        session_id: sessionId,
        sequence: 0,
        request_id: `err_${this.now()}`,
        payload: { code: "NOT_FOUND", message: "Session not found" },
      };
    }
    return this.hub.snapshot(sessionId, { status: snapshot.status, participants: snapshot.participants, expires_at: snapshot.expires_at });
  }

  private ack(sessionId: string, type: "heartbeat_ack" | "lifecycle_ack" | "workspace_ack" | "unsubscribe_ack", payload: Record<string, unknown>): ServerMessage {
    return { type, session_id: sessionId, sequence: 0, request_id: `${type}_${this.now()}`, payload } as ServerMessage;
  }

  private error(sessionId: string, code: "FORBIDDEN" | "NOT_FOUND" | "CONFLICT", message: string): ServerMessage {
    return { type: "error", session_id: sessionId, sequence: 0, request_id: `err_${this.now()}`, payload: { code, message } };
  }
}

export { realtimeHub };
export type { RealtimeEvent, RealtimeEventType };

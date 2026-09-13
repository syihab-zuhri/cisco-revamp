import { createHash, randomUUID } from "node:crypto";

export type SessionStatus = "active" | "host_disconnected" | "closed" | "expired";
export type ParticipantStatus = "waiting" | "working" | "submitted" | "disconnected" | "removed";

type Clock = { now: () => number };
export type ClassSession = {
  id: string;
  classCodeHash: string;
  hostTokenHash: string;
  status: SessionStatus;
  expiresAt: number;
  closedAt?: number;
  hostDisconnectedAt?: number;
  hostGraceDeadline?: number;
  createdAt: number;
  updatedAt: number;
};

export type ParticipantSession = {
  id: string;
  sessionId: string;
  nickname: string;
  joinTokenHash: string;
  status: ParticipantStatus;
  joinedAt: number;
  lastSeenAt: number;
};

type CreateOptions = { classCode: string; hostToken: string };
type JoinOptions = { classCode: string; nickname: string; joinToken: string };
type StoreOptions = Clock & { sessionTtlMs?: number; hostGraceMs?: number };

export class ClassroomSessionStore {
  private readonly sessions = new Map<string, ClassSession>();
  private readonly participants = new Map<string, ParticipantSession>();
  private readonly now: () => number;
  private readonly sessionTtlMs: number;
  private readonly hostGraceMs: number;

  constructor(options: StoreOptions) {
    this.now = options.now;
    this.sessionTtlMs = options.sessionTtlMs ?? 24 * 60 * 60 * 1000;
    this.hostGraceMs = options.hostGraceMs ?? 60_000;
  }

  createSession(options: CreateOptions): { session: ClassSession; hostTokenHash: string } {
    if (!/^CS-[A-Z0-9]{4,12}$/.test(options.classCode)) throw new Error("Invalid class code");
    if (!options.hostToken) throw new Error("Host token is required");
    const now = this.now();
    const session: ClassSession = {
      id: randomUUID(),
      classCodeHash: hashValue(options.classCode),
      hostTokenHash: hashValue(options.hostToken),
      status: "active",
      expiresAt: now + this.sessionTtlMs,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    return { session: clone(session), hostTokenHash: session.hostTokenHash };
  }

  joinSession(sessionId: string, options: JoinOptions): ParticipantSession {
    const session = this.requireMutableSession(sessionId);
    if (hashValue(options.classCode) !== session.classCodeHash) throw new Error("Invalid class code");
    const nickname = options.nickname.trim();
    if (nickname.length < 1 || nickname.length > 40) throw new Error("Nickname must be 1-40 characters");
    if (!options.joinToken) throw new Error("Join token is required");
    const now = this.now();
    const participant: ParticipantSession = {
      id: randomUUID(),
      sessionId,
      nickname,
      joinTokenHash: hashValue(options.joinToken),
      status: "working",
      joinedAt: now,
      lastSeenAt: now,
    };
    this.participants.set(participant.id, participant);
    session.updatedAt = now;
    return clone(participant);
  }

  getSession(sessionId: string): ClassSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    this.reconcileSession(session, this.now());
    return clone(session);
  }

  getParticipant(participantId: string): ParticipantSession | undefined {
    const participant = this.participants.get(participantId);
    return participant ? clone(participant) : undefined;
  }

  findParticipantByTokenHash(tokenHash: string): ParticipantSession | undefined {
    for (const participant of this.participants.values()) {
      if (participant.joinTokenHash === tokenHash) return clone(participant);
    }
    return undefined;
  }

  listParticipants(sessionId: string): ParticipantSession[] {
    return [...this.participants.values()]
      .filter((participant) => participant.sessionId === sessionId)
      .map((participant) => clone(participant));
  }

  requireMutableSessionView(sessionId: string): ClassSession {
    return this.requireMutableSession(sessionId);
  }

  markParticipantWorking(participantId: string): ParticipantSession {
    return this.updateParticipantStatus(participantId, "working");
  }

  markParticipantSubmitted(participantId: string): ParticipantSession {
    return this.updateParticipantStatus(participantId, "submitted");
  }

  private updateParticipantStatus(participantId: string, status: ParticipantStatus): ParticipantSession {
    const participant = this.participants.get(participantId);
    if (!participant) throw new Error("Participant not found");
    const session = this.requireMutableSession(participant.sessionId);
    participant.status = status;
    participant.lastSeenAt = this.now();
    session.updatedAt = participant.lastSeenAt;
    return clone(participant);
  }

  markHostDisconnected(sessionId: string): void {
    const session = this.requireMutableSession(sessionId);
    const now = this.now();
    session.status = "host_disconnected";
    session.hostDisconnectedAt = now;
    session.hostGraceDeadline = now + this.hostGraceMs;
    session.updatedAt = now;
  }

  markHostReconnected(sessionId: string): void {
    const session = this.requireMutableSession(sessionId);
    session.status = "active";
    session.hostDisconnectedAt = undefined;
    session.hostGraceDeadline = undefined;
    session.updatedAt = this.now();
  }

  closeSession(sessionId: string): void {
    const session = this.requireMutableSession(sessionId);
    session.status = "closed";
    session.closedAt = this.now();
    session.updatedAt = session.closedAt;
  }

  cleanupExpired(): number {
    this.reconcileLifecycle();
    let removed = 0;
    for (const [id, session] of this.sessions) {
      if (session.status === "expired" || session.status === "closed") {
        this.sessions.delete(id);
        for (const [participantId, participant] of this.participants) {
          if (participant.sessionId === id) this.participants.delete(participantId);
        }
        removed += 1;
      }
    }
    return removed;
  }

  reconcileLifecycle(): void {
    const now = this.now();
    for (const session of this.sessions.values()) this.reconcileSession(session, now);
  }

  private reconcileSession(session: ClassSession, now: number): void {
    if (session.status === "active" && now >= session.expiresAt) {
      session.status = "expired";
      session.updatedAt = now;
      return;
    }
    if (session.status === "host_disconnected" && session.hostGraceDeadline !== undefined && now >= session.hostGraceDeadline) {
      session.status = "closed";
      session.closedAt = now;
      session.updatedAt = now;
    }
  }

  private requireMutableSession(sessionId: string): ClassSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    this.reconcileSession(session, this.now());
    if (session.status !== "active") throw new Error(`Session is ${session.status}`);
    return session;
  }
}

export function hashValue(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

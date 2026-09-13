import { authorizeParticipant, authorizeRequest, hashToken } from "./security.ts";
import { ClassroomSessionStore, hashValue, type ClassSession } from "./session.ts";
import { CourseworkStore, type ResultProjection, type StoredExercise, type StoredSubmission, type StoredWorkspace } from "./coursework.ts";
import type { Exercise } from "../simulator/exercise.ts";
import type { Topology } from "../simulator/core.ts";

export type ApiErrorCode = "INVALID_INPUT" | "NOT_FOUND" | "FORBIDDEN" | "CONFLICT" | "RATE_LIMITED";
export type ApiError = { code: ApiErrorCode; message: string; details: string[]; request_id: string };
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

type CreateInput = { class_code: string; host_token: string };
type JoinInput = { class_code: string; nickname: string; join_token: string };
type Actor = { role: "host" | "participant"; token: string };

type ClassData = { id: string; status: ClassSession["status"]; expires_at: number };
type JoinData = { id: string; nickname: string; status: string; snapshot: Snapshot };
type Snapshot = { session_id: string; status: ClassSession["status"]; expires_at: number; participants: Array<{ id: string; nickname: string; status: string }> };

export class ClassroomApi {
  private readonly store: ClassroomSessionStore;
  private readonly coursework: CourseworkStore;

  constructor(store: ClassroomSessionStore, coursework?: CourseworkStore) {
    this.store = store;
    this.coursework = coursework ?? new CourseworkStore(store, { now: () => Date.now() });
  }

  async createClass(input: CreateInput): Promise<ApiResult<ClassData>> {
    try {
      const created = this.store.createSession({ classCode: input.class_code, hostToken: input.host_token });
      return { ok: true, data: { id: created.session.id, status: created.session.status, expires_at: created.session.expiresAt } };
    } catch (error) {
      return fail("INVALID_INPUT", message(error));
    }
  }

  async joinClass(sessionId: string, input: JoinInput): Promise<ApiResult<JoinData>> {
    try {
      const participant = this.store.joinSession(sessionId, { classCode: input.class_code, nickname: input.nickname, joinToken: input.join_token });
      const snapshot = this.buildSnapshot(sessionId);
      return { ok: true, data: { id: participant.id, nickname: participant.nickname, status: participant.status, snapshot } };
    } catch (error) {
      return fail(this.errorCode(error), this.publicMessage(error));
    }
  }

  async getSnapshot(sessionId: string, actor: Actor): Promise<ApiResult<Snapshot>> {
    const session = this.store.getSession(sessionId);
    if (!session) return fail("NOT_FOUND", "Session not found");
    const participant = actor.role === "participant" ? this.store.findParticipantByTokenHash(hashToken(actor.token)) : undefined;
    const allowed = actor.role === "host"
      ? authorizeRequest(session, hashToken(actor.token), "host")
      : Boolean(participant && participant.sessionId === sessionId && authorizeParticipant(participant.joinTokenHash, hashToken(actor.token)));
    if (!allowed) return fail("FORBIDDEN", "Not authorized to read this session");
    return { ok: true, data: this.buildSnapshot(sessionId) };
  }

  async changeLifecycle(sessionId: string, action: "close" | "disconnect" | "reconnect", hostToken: string): Promise<ApiResult<{ status: string }>> {
    const session = this.store.getSession(sessionId);
    if (!session) return fail("NOT_FOUND", "Session not found");
    if (!authorizeRequest(session, hashToken(hostToken), "host")) return fail("FORBIDDEN", "Host authorization required");
    try {
      if (action === "close") this.store.closeSession(sessionId);
      if (action === "disconnect") this.store.markHostDisconnected(sessionId);
      if (action === "reconnect") this.store.markHostReconnected(sessionId);
      return { ok: true, data: { status: this.store.getSession(sessionId)!.status } };
    } catch (error) {
      return fail(this.errorCode(error), this.publicMessage(error));
    }
  }

  async createExercise(sessionId: string, exercise: Exercise, hostToken: string): Promise<ApiResult<StoredExercise>> {
    const session = this.store.getSession(sessionId);
    if (!session) return fail("NOT_FOUND", "Session not found");
    if (!authorizeRequest(session, hashToken(hostToken), "host")) return fail("FORBIDDEN", "Host authorization required");
    try {
      return { ok: true, data: this.coursework.createExercise(sessionId, exercise) };
    } catch (error) {
      return fail(this.errorCode(error), this.publicMessage(error));
    }
  }

  async startExercise(sessionId: string, exerciseId: string, hostToken: string): Promise<ApiResult<StoredExercise>> {
    const session = this.store.getSession(sessionId);
    if (!session) return fail("NOT_FOUND", "Session not found");
    if (!authorizeRequest(session, hashToken(hostToken), "host")) return fail("FORBIDDEN", "Host authorization required");
    try {
      return { ok: true, data: this.coursework.startExercise(sessionId, exerciseId) };
    } catch (error) {
      return fail(this.errorCode(error), this.publicMessage(error));
    }
  }

  async getActiveExercise(sessionId: string, actor: Actor): Promise<ApiResult<StoredExercise | null>> {
    const session = this.store.getSession(sessionId);
    if (!session) return fail("NOT_FOUND", "Session not found");
    const allowed = actor.role === "host"
      ? authorizeRequest(session, hashToken(actor.token), "host")
      : this.isParticipantAuthorized(sessionId, actor.token);
    if (!allowed) return fail("FORBIDDEN", "Authorization required");
    return { ok: true, data: this.coursework.getActiveExercise(sessionId) ?? null };
  }

  async saveParticipantWorkspace(sessionId: string, payload: string, participantToken: string, expectedVersion?: number): Promise<ApiResult<StoredWorkspace>> {
    const participant = this.store.findParticipantByTokenHash(hashToken(participantToken));
    if (!participant || participant.sessionId !== sessionId) return fail("FORBIDDEN", "Invalid participant token");
    try {
      return { ok: true, data: this.coursework.saveWorkspace(participant.id, payload, expectedVersion) };
    } catch (error) {
      return fail(this.errorCode(error), this.publicMessage(error));
    }
  }

  async submitParticipantWorkspace(sessionId: string, payload: string, submissionKey: string, participantToken: string, expectedVersion?: number): Promise<ApiResult<StoredSubmission>> {
    const participant = this.store.findParticipantByTokenHash(hashToken(participantToken));
    if (!participant || participant.sessionId !== sessionId) return fail("FORBIDDEN", "Invalid participant token");
    try {
      return { ok: true, data: this.coursework.submitWorkspace(participant.id, payload, submissionKey, expectedVersion) };
    } catch (error) {
      return fail(this.errorCode(error), this.publicMessage(error));
    }
  }

  async getResults(sessionId: string, hostToken: string): Promise<ApiResult<ResultProjection[]>> {
    const session = this.store.getSession(sessionId);
    if (!session) return fail("NOT_FOUND", "Session not found");
    if (!authorizeRequest(session, hashToken(hostToken), "host")) return fail("FORBIDDEN", "Host authorization required");
    try {
      return { ok: true, data: this.coursework.resultsForSession(sessionId) };
    } catch (error) {
      return fail(this.errorCode(error), this.publicMessage(error));
    }
  }

  async getWorkspacePreview(sessionId: string, participantId: string, hostToken: string): Promise<ApiResult<Topology | null>> {
    const session = this.store.getSession(sessionId);
    if (!session) return fail("NOT_FOUND", "Session not found");
    if (!authorizeRequest(session, hashToken(hostToken), "host")) return fail("FORBIDDEN", "Host authorization required");
    try {
      return { ok: true, data: this.coursework.workspacePreview(sessionId, participantId) ?? null };
    } catch (error) {
      return fail(this.errorCode(error), this.publicMessage(error));
    }
  }

  private isParticipantAuthorized(sessionId: string, token: string): boolean {
    const participant = this.store.findParticipantByTokenHash(hashToken(token));
    return Boolean(participant && participant.sessionId === sessionId && authorizeParticipant(participant.joinTokenHash, hashToken(token)));
  }

  private buildSnapshot(sessionId: string): Snapshot {
    const session = this.store.getSession(sessionId);
    if (!session) throw new Error("Session not found");
    const participants = this.store.listParticipants(sessionId).map((participant) => ({ id: participant.id, nickname: participant.nickname, status: participant.status }));
    return { session_id: session.id, status: session.status, expires_at: session.expiresAt, participants };
  }

  private errorCode(error: unknown): ApiErrorCode {
    const text = message(error).toLowerCase();
    if (text.includes("not found")) return "NOT_FOUND";
    if (text.includes("authorization") || text.includes("invalid class code")) return "FORBIDDEN";
    if (text.includes("already") || text.includes("closed") || text.includes("expired")) return "CONFLICT";
    return "INVALID_INPUT";
  }

  private publicMessage(error: unknown): string {
    const text = message(error);
    return text.toLowerCase().includes("token") ? "Request credentials are invalid" : text;
  }
}

function fail(code: ApiErrorCode, text: string): { ok: false; error: ApiError } {
  return { ok: false, error: { code, message: text, details: [], request_id: `req_${hashValue(`${Date.now()}_${Math.random()}`).slice(0, 12)}` } };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : "Request is invalid";
}

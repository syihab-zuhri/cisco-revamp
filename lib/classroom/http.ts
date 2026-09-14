import { ClassroomApi, type ApiError, type ApiResult } from "./api.ts";
import { ClassroomSessionStore } from "./session.ts";
import { CourseworkStore } from "./coursework.ts";
import { realtimeHub, RealtimeHub, type RealtimeEventType } from "./realtime/hub.ts";
import { RealtimeProtocol } from "./realtime/protocol.ts";
import { TicketStore } from "./tickets.ts";

type Runtime = { api: ClassroomApi; store: ClassroomSessionStore; coursework: CourseworkStore; hub: RealtimeHub; protocol: RealtimeProtocol; tickets: TicketStore };
const runtimeKey = Symbol.for("netlab.classroom.runtime");
type RuntimeGlobal = typeof globalThis & { [runtimeKey]?: Runtime };

function runtime(): Runtime {
  const globalRuntime = globalThis as RuntimeGlobal;
  if (!globalRuntime[runtimeKey]) {
    const store = new ClassroomSessionStore({ now: () => Date.now() });
    const coursework = new CourseworkStore(store, { now: () => Date.now() });
    const hub = realtimeHub();
    const api = new ClassroomApi(store, coursework, hub);
    globalRuntime[runtimeKey] = {
      store,
      coursework,
      hub,
      api,
      protocol: new RealtimeProtocol(api, hub),
      tickets: new TicketStore(),
    };
  }
  return globalRuntime[runtimeKey] as Runtime;
}

export function classroomApi(): ClassroomApi {
  return runtime().api;
}

export function classroomProtocol(): RealtimeProtocol {
  return runtime().protocol;
}

export function classroomTickets(): TicketStore {
  return runtime().tickets;
}

export function publishToSession(sessionId: string, type: RealtimeEventType, payload: Record<string, unknown>): void {
  runtime().hub.publish(sessionId, { type, payload });
}

export function bearerToken(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return undefined;
  const token = header.slice("Bearer ".length).trim();
  return token || undefined;
}

export function jsonBody<T>(request: Request): Promise<T | undefined> {
  return request.json().catch(() => undefined) as Promise<T | undefined>;
}

export function response<T>(result: ApiResult<T>, successStatus = 200): Response {
  if (result.ok) return Response.json({ ok: true, data: result.data }, { status: successStatus });
  return Response.json({ ok: false, error: result.error }, { status: statusFor(result.error) });
}

function statusFor(error: ApiError): number {
  if (error.code === "INVALID_INPUT") return 400;
  if (error.code === "FORBIDDEN") return 403;
  if (error.code === "NOT_FOUND") return 404;
  if (error.code === "RATE_LIMITED") return 429;
  return 409;
}

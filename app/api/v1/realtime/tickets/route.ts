import { bearerToken, classroomApi, classroomTickets, jsonBody, response } from "../../../../../lib/classroom/http.ts";

type TicketBody = { session_id?: string; role?: "host" | "participant" };

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const token = bearerToken(request);
  const body = await jsonBody<TicketBody>(request);
  if (!token || !body || typeof body.session_id !== "string" || (body.role !== "host" && body.role !== "participant")) {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "session_id, role, and bearer token are required", details: [], request_id: "req_invalid" } }, 400);
  }
  if (!classroomApi().isAuthorized(body.session_id, { role: body.role, token })) {
    return response({ ok: false, error: { code: "FORBIDDEN", message: "Not authorized for this session", details: [], request_id: "req_forbidden" } }, 403);
  }
  const ticket = classroomTickets().issue(body.session_id, { role: body.role, token });
  return response({ ok: true, data: { ticket: ticket.ticket, expires_at: ticket.expiresAt } }, 201);
}

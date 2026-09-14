import { classroomProtocol, classroomTickets, response } from "../../../../lib/classroom/http.ts";
import type { RealtimeEvent } from "../../../../lib/classroom/realtime/hub.ts";

export const dynamic = "force-dynamic";

const HEARTBEAT_INTERVAL_MS = 15_000;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const ticketValue = url.searchParams.get("ticket");
  const lastSeen = Number.parseInt(url.searchParams.get("last_sequence") ?? "0", 10);
  if (!ticketValue) {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "ticket query parameter is required", details: [], request_id: "req_invalid" } }, 400);
  }
  const ticket = classroomTickets().consume(ticketValue);
  if (!ticket) {
    return response({ ok: false, error: { code: "FORBIDDEN", message: "Ticket is invalid, expired, or already used", details: [], request_id: "req_forbidden" } }, 403);
  }

  const protocol = classroomProtocol();
  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (event: Record<string, unknown>) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // initial snapshot + replay of anything missed since last_sequence
      for (const message of protocol.handleCommand({
        type: "reconcile",
        session_id: ticket.sessionId,
        role: ticket.actor.role,
        token: ticket.actor.token,
        last_seen_sequence: Number.isFinite(lastSeen) ? lastSeen : 0,
      })) {
        send(message as unknown as Record<string, unknown>);
      }

      unsubscribe = protocol.registerSubscriber(ticket.sessionId, (event: RealtimeEvent) => send(event as unknown as Record<string, unknown>));
      heartbeat = setInterval(() => send({ type: "heartbeat_ack", session_id: ticket.sessionId, sequence: 0, request_id: `hb_${Date.now()}`, payload: { server_time: Date.now() } }), HEARTBEAT_INTERVAL_MS);
      heartbeat.unref?.();

      request.signal.addEventListener("abort", () => {
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        unsubscribe?.();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

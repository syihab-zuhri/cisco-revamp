import { classroomDiagnostics } from "@/lib/classroom/http";

export const dynamic = "force-dynamic";

export function GET() {
  const diag = classroomDiagnostics();
  const ready = diag.sessionStoreReachable && diag.realtimeHubReachable;
  const body = {
    ok: ready,
    data: {
      status: ready ? "ready" : "degraded",
      activeSessions: diag.activeSessions,
      activeParticipants: diag.activeParticipants,
      bufferedEvents: diag.bufferedEvents,
      subscribers: diag.subscribers,
      outstandingTickets: diag.outstandingTickets,
    },
  };
  return Response.json(body, { status: ready ? 200 : 503 });
}

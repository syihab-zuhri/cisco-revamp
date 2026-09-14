export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, data: { status: "alive", ts: new Date().toISOString() } });
}

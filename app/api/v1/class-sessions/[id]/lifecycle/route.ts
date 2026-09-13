import { bearerToken, classroomApi, jsonBody, response } from "../../../../../../lib/classroom/http.ts";

type Context = { params: Promise<{ id: string }> };
type LifecycleBody = { action?: "close" | "disconnect" | "reconnect" };

export async function POST(request: Request, context: Context): Promise<Response> {
  const token = bearerToken(request);
  const body = await jsonBody<LifecycleBody>(request);
  if (!token || !body || !body.action) {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "Authorization and lifecycle action are required", details: [], request_id: "req_invalid" } }, 400);
  }
  const { id } = await context.params;
  return response(await classroomApi().changeLifecycle(id, body.action, token));
}

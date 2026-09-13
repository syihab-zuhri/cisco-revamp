import { bearerToken, classroomApi, response } from "../../../../../../../lib/classroom/http.ts";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  const { id } = await context.params;
  const role = new URL(request.url).searchParams.get("role");
  if (role !== "host" && role !== "participant") {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "role must be host or participant", details: [], request_id: "req_invalid" } }, 400);
  }
  const token = bearerToken(request);
  if (!token) {
    return response({ ok: false, error: { code: "FORBIDDEN", message: "Authorization required", details: [], request_id: "req_forbidden" } }, 403);
  }
  return response(await classroomApi().getActiveExercise(id, { role, token }));
}

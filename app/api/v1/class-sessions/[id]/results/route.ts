import { bearerToken, classroomApi, response } from "../../../../../../lib/classroom/http.ts";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  const token = bearerToken(request);
  if (!token) {
    return response({ ok: false, error: { code: "FORBIDDEN", message: "Host authorization required", details: [], request_id: "req_forbidden" } }, 403);
  }
  const { id } = await context.params;
  return response(await classroomApi().getResults(id, token));
}

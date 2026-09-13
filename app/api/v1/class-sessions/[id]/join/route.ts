import { jsonBody, classroomApi, response } from "../../../../../../lib/classroom/http.ts";

type JoinBody = { class_code?: string; nickname?: string; join_token?: string };
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context): Promise<Response> {
  const body = await jsonBody<JoinBody>(request);
  if (!body || typeof body.class_code !== "string" || typeof body.nickname !== "string" || typeof body.join_token !== "string") {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "Request is invalid", details: [], request_id: "req_invalid" } }, 400);
  }
  const { id } = await context.params;
  return response(await classroomApi().joinClass(id, {
    class_code: body.class_code,
    nickname: body.nickname,
    join_token: body.join_token,
  }), 201);
}

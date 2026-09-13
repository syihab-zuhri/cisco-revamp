import { jsonBody, classroomApi, response } from "../../../../lib/classroom/http.ts";

type CreateBody = { class_code?: string; host_token?: string };

export async function POST(request: Request): Promise<Response> {
  const body = await jsonBody<CreateBody>(request);
  if (!body || typeof body.class_code !== "string" || typeof body.host_token !== "string") {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "Request is invalid", details: [], request_id: "req_invalid" } }, 400);
  }
  return response(await classroomApi().createClass({ class_code: body.class_code, host_token: body.host_token }), 201);
}

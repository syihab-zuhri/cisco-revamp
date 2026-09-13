import { bearerToken, classroomApi, jsonBody, response } from "../../../../../../lib/classroom/http.ts";

type Context = { params: Promise<{ id: string }> };
type SubmitBody = { payload?: string; submission_key?: string; expected_version?: number };

export async function POST(request: Request, context: Context): Promise<Response> {
  const token = bearerToken(request);
  const body = await jsonBody<SubmitBody>(request);
  if (!token || !body || typeof body.payload !== "string" || typeof body.submission_key !== "string") {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "Authorization, payload, and submission_key are required", details: [], request_id: "req_invalid" } }, 400);
  }
  const { id } = await context.params;
  return response(await classroomApi().submitParticipantWorkspace(id, body.payload, body.submission_key, token, body.expected_version), 201);
}

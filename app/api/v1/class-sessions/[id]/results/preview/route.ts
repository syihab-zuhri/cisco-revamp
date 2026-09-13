import { bearerToken, classroomApi, response } from "../../../../../../../lib/classroom/http.ts";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  const token = bearerToken(request);
  const participantId = new URL(request.url).searchParams.get("participant_id");
  if (!token || !participantId) {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "Host token and participant_id are required", details: [], request_id: "req_invalid" } }, 400);
  }
  const { id } = await context.params;
  return response(await classroomApi().getWorkspacePreview(id, participantId, token));
}

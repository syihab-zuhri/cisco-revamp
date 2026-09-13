import { bearerToken, classroomApi, jsonBody, response } from "../../../../../../lib/classroom/http.ts";
import type { Exercise } from "../../../../../../lib/simulator/exercise.ts";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context): Promise<Response> {
  const token = bearerToken(request);
  const body = await jsonBody<{ exercise?: Exercise }>(request);
  if (!token || !body || !body.exercise) {
    return response({ ok: false, error: { code: "INVALID_INPUT", message: "Authorization and exercise payload are required", details: [], request_id: "req_invalid" } }, 400);
  }
  const { id } = await context.params;
  return response(await classroomApi().createExercise(id, body.exercise, token), 201);
}

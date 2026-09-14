import assert from "node:assert/strict";
import test from "node:test";
import { POST as issueTicket } from "../../../app/api/v1/realtime/tickets/route.ts";
import { GET as openStream } from "../../../app/api/v1/realtime/route.ts";
import { POST as createClass } from "../../../app/api/v1/class-sessions/route.ts";
import { POST as joinClass } from "../../../app/api/v1/class-sessions/[id]/join/route.ts";

const postJson = (value: unknown, token?: string) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(value),
  });

async function readEvents(response: Response, count: number): Promise<Record<string, unknown>[]> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  const events: Record<string, unknown>[] = [];
  let buffer = "";
  while (events.length < count) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const dataLine = part.split("\n").find((line) => line.startsWith("data: "));
      if (dataLine) events.push(JSON.parse(dataLine.slice("data: ".length)) as Record<string, unknown>);
    }
  }
  reader.releaseLock();
  return events;
}

test("realtime ticket flow: issue ticket then stream snapshot and live events", async () => {
  // create a class through the real routes
  const createdRes = await createClass(postJson({ class_code: "CS-RTS001", host_token: "host-sse" }));
  const created = await createdRes.json();
  const sessionId = created.data.id as string;

  // participant joins through the real route so the singleton store knows them
  const joinRes = await joinClass(postJson({ class_code: "CS-RTS001", nickname: "Sara", join_token: "student-sse" }), { params: Promise.resolve({ id: sessionId }) });
  assert.equal(joinRes.status, 201);

  // student issues a short-lived ticket with their bearer token
  const ticketRes = await issueTicket(postJson({ session_id: sessionId, role: "participant" }, "student-sse"));
  assert.equal(ticketRes.status, 201);
  const ticketBody = await ticketRes.json();
  assert.equal(ticketBody.ok, true);
  const ticket = ticketBody.data.ticket as string;

  // tickets are single-use: reuse with the same token is fine (new ticket), but consuming twice fails
  const streamRes = await openStream(new Request(`http://localhost/api/v1/realtime?ticket=${ticket}`));
  assert.equal(streamRes.status, 200);
  assert.equal(streamRes.headers.get("content-type"), "text/event-stream");

  const replayRes = await openStream(new Request(`http://localhost/api/v1/realtime?ticket=${ticket}`));
  assert.equal(replayRes.status, 403);

  // first message is the session snapshot with the participant present
  const events = await readEvents(streamRes, 1);
  assert.equal(events[0].type, "session_snapshot");
  assert.equal(events[0].session_id, sessionId);
  const participants = (events[0].payload as { participants: Array<{ nickname: string }> }).participants;
  assert.deepEqual(participants.map((p) => p.nickname), ["Sara"]);

  // a live event published server-side reaches the open stream.
  // reconcile replayed buffered events first (participant_joined), so read until the live one.
  const { publishToSession } = await import("../http.ts");
  publishToSession(sessionId, "participant_presence_changed", { participant_id: "p1", status: "submitted" });
  const buffered: Record<string, unknown>[] = [];
  const deadline = Date.now() + 2000;
  while (!buffered.some((event) => event.type === "participant_presence_changed") && Date.now() < deadline) {
    buffered.push(...(await readEvents(streamRes, 1)));
  }
  assert.equal(buffered.at(-1)?.type, "participant_presence_changed");

  // close the stream so the heartbeat timer does not keep the process alive
  const closer = streamRes.body!.getReader();
  await closer.cancel();
  closer.releaseLock();
});

test("ticket issuance requires valid credentials", async () => {
  const createdRes = await createClass(postJson({ class_code: "CS-RTS002", host_token: "host-sse2" }));
  const created = await createdRes.json();
  const sessionId = created.data.id as string;

  const denied = await issueTicket(postJson({ session_id: sessionId, role: "participant" }, "wrong-token"));
  assert.equal(denied.status, 403);
  const body = await denied.json();
  assert.equal(body.error.code, "FORBIDDEN");

  const noBody = await issueTicket(new Request("http://localhost/api", { method: "POST", headers: { authorization: "Bearer host-sse2" } }));
  assert.equal(noBody.status, 400);
});

test("stream without a ticket is rejected", async () => {
  const res = await openStream(new Request("http://localhost/api/v1/realtime"));
  assert.equal(res.status, 400);
});

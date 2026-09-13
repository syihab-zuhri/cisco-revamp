import assert from "node:assert/strict";
import test from "node:test";
import { POST as createClass } from "../../app/api/v1/class-sessions/route.ts";
import { POST as joinClass } from "../../app/api/v1/class-sessions/[id]/join/route.ts";
import { GET as getSnapshot } from "../../app/api/v1/class-sessions/[id]/route.ts";
import { POST as lifecycle } from "../../app/api/v1/class-sessions/[id]/lifecycle/route.ts";

const json = (value: unknown) => new Request("http://localhost/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) });

 test("classroom routes create, join, read snapshot, and close", async () => {
  const createdResponse = await createClass(json({ class_code: "CS-HTTP01", host_token: "host-secret" }));
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.equal(created.ok, true);

  const id = created.data.id as string;
  const joinedResponse = await joinClass(json({ class_code: "CS-HTTP01", nickname: "Nara", join_token: "student-secret" }), { params: Promise.resolve({ id }) });
  assert.equal(joinedResponse.status, 201);

  const snapshotResponse = await getSnapshot(new Request(`http://localhost/api/v1/class-sessions/${id}?role=participant` , { headers: { authorization: "Bearer student-secret" } }), { params: Promise.resolve({ id }) });
  assert.equal(snapshotResponse.status, 200);
  const snapshot = await snapshotResponse.json();
  assert.equal(snapshot.data.participants[0].nickname, "Nara");

  const lifecycleResponse = await lifecycle(new Request(`http://localhost/api/v1/class-sessions/${id}/lifecycle`, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer host-secret" }, body: JSON.stringify({ action: "close" }) }), { params: Promise.resolve({ id }) });
  assert.equal(lifecycleResponse.status, 200);
});

test("route returns canonical 400 and 403 envelopes", async () => {
  const invalid = await createClass(json({ class_code: "bad", host_token: "" }));
  assert.equal(invalid.status, 400);
  const invalidBody = await invalid.json();
  assert.equal(invalidBody.error.code, "INVALID_INPUT");

  const missing = await getSnapshot(new Request("http://localhost/api/v1/class-sessions/missing?role=participant"), { params: Promise.resolve({ id: "missing" }) });
  assert.equal(missing.status, 403);
  const missingBody = await missing.json();
  assert.equal(missingBody.error.code, "FORBIDDEN");
});

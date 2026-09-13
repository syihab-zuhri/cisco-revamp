import assert from "node:assert/strict";
import test from "node:test";
import { ClassroomApi } from "./api.ts";
import { ClassroomSessionStore } from "./session.ts";

function api() {
  return new ClassroomApi(new ClassroomSessionStore({ now: () => 1_000 }));
}

test("create class returns canonical success envelope without plaintext host token", async () => {
  const result = await api().createClass({ class_code: "CS-API001", host_token: "host-secret" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.status, "active");
    assert.equal("host_token" in result.data, false);
    assert.equal("host_token_hash" in result.data, false);
  }
});

test("join returns participant credential and snapshot", async () => {
  const service = api();
  const created = await service.createClass({ class_code: "CS-JOIN01", host_token: "host-secret" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const joined = await service.joinClass(created.data.id, { class_code: "CS-JOIN01", nickname: "Alya", join_token: "join-secret" });
  assert.equal(joined.ok, true);
  if (joined.ok) {
    assert.equal(joined.data.nickname, "Alya");
    assert.equal(joined.data.status, "working");
    assert.equal(joined.data.snapshot.session_id, created.data.id);
  }
});

test("invalid input and unauthorized host actions use canonical error envelope", async () => {
  const service = api();
  const invalid = await service.createClass({ class_code: "bad", host_token: "" });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.error.code, "INVALID_INPUT");

  const created = await service.createClass({ class_code: "CS-AUTH01", host_token: "host-secret" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const denied = await service.changeLifecycle(created.data.id, "close", "wrong-token");
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.error.code, "FORBIDDEN");
});

test("host can close a class and GET snapshot only exposes authorized projections", async () => {
  const service = api();
  const created = await service.createClass({ class_code: "CS-SNAP01", host_token: "host-secret" });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const joined = await service.joinClass(created.data.id, { class_code: "CS-SNAP01", nickname: "Bima", join_token: "student-secret" });
  assert.equal(joined.ok, true);
  const snapshot = await service.getSnapshot(created.data.id, { role: "participant", token: "student-secret" });
  assert.equal(snapshot.ok, true);
  if (snapshot.ok) {
    assert.equal(snapshot.data.participants[0].nickname, "Bima");
    assert.equal("host_token_hash" in snapshot.data, false);
  }
  const closed = await service.changeLifecycle(created.data.id, "close", "host-secret");
  assert.equal(closed.ok, true);
});

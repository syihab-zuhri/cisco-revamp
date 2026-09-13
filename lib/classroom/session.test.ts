import assert from "node:assert/strict";
import test from "node:test";
import { ClassroomSessionStore } from "./session.ts";
import { RateLimiter, authorizeParticipant, authorizeRequest, hashToken } from "./security.ts";

test("creates a class with opaque credentials and allows a valid participant join", () => {
  const store = new ClassroomSessionStore({ now: () => 1_000 });
  const created = store.createSession({ classCode: "CS-AB12CD", hostToken: "host-secret" });

  assert.equal(created.session.status, "active");
  assert.notEqual(created.session.classCodeHash, "CS-AB12CD");
  assert.equal("hostToken" in created.session, false);
  const joined = store.joinSession(created.session.id, { classCode: "CS-AB12CD", nickname: "Alya", joinToken: "student-secret" });
  assert.equal(joined.nickname, "Alya");
  assert.equal(joined.status, "working");
});

test("enforces host and participant authority boundaries", () => {
  const store = new ClassroomSessionStore({ now: () => 1_000 });
  const created = store.createSession({ classCode: "CS-ROOM01", hostToken: "host-secret" });
  const participant = store.joinSession(created.session.id, { classCode: "CS-ROOM01", nickname: "Bima", joinToken: "student-secret" });

  assert.equal(authorizeRequest(created.session, hashToken("host-secret"), "host"), true);
  assert.equal(authorizeRequest(created.session, hashToken("student-secret"), "host"), false);
  assert.equal(authorizeParticipant(participant.joinTokenHash, hashToken("student-secret")), true);
  assert.equal(authorizeParticipant(participant.joinTokenHash, hashToken("wrong-secret")), false);
});

test("expires sessions and rejects mutations after expiry", () => {
  let now = 1_000;
  const store = new ClassroomSessionStore({ now: () => now, sessionTtlMs: 100 });
  const created = store.createSession({ classCode: "CS-EXPIRE", hostToken: "host-secret" });
  now = 1_101;

  assert.equal(store.getSession(created.session.id)?.status, "expired");
  assert.throws(() => store.joinSession(created.session.id, { classCode: "CS-EXPIRE", nickname: "Cici", joinToken: "student-secret" }), /expired|closed/i);
  assert.equal(store.cleanupExpired(), 1);
  assert.equal(store.getSession(created.session.id), undefined);
});

test("tracks host disconnect grace period and closes after deadline", () => {
  let now = 1_000;
  const store = new ClassroomSessionStore({ now: () => now, hostGraceMs: 100 });
  const created = store.createSession({ classCode: "CS-GRACE1", hostToken: "host-secret" });
  store.markHostDisconnected(created.session.id);
  assert.equal(store.getSession(created.session.id)?.status, "host_disconnected");
  now = 1_101;
  store.reconcileLifecycle();
  assert.equal(store.getSession(created.session.id)?.status, "closed");
});

test("rate limiter blocks after the configured number of attempts", () => {
  const limiter = new RateLimiter({ maxAttempts: 2, windowMs: 1_000, now: () => 10 });
  assert.equal(limiter.allow("ip:127.0.0.1"), true);
  assert.equal(limiter.allow("ip:127.0.0.1"), true);
  assert.equal(limiter.allow("ip:127.0.0.1"), false);
});

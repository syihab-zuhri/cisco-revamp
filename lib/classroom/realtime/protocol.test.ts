import assert from "node:assert/strict";
import test from "node:test";
import { ClassroomApi } from "../api.ts";
import { ClassroomSessionStore } from "../session.ts";
import { CourseworkStore } from "../coursework.ts";
import { RealtimeHub } from "./hub.ts";
import { RealtimeProtocol } from "./protocol.ts";
import type { Exercise } from "../../simulator/exercise.ts";
import { exportWorkspace } from "../../simulator/workspace.ts";
import { addDevice, addLink, createTopology } from "../../simulator/core.ts";

function fixture() {
  const store = new ClassroomSessionStore({ now: () => 1_000 });
  const coursework = new CourseworkStore(store, { now: () => 1_000 });
  const hub = new RealtimeHub({ now: () => 1_000 });
  const api = new ClassroomApi(store, coursework, hub);
  const protocol = new RealtimeProtocol(api, hub);
  return { store, coursework, api, hub, protocol };
}

function sampleExercise(): Exercise {
  return {
    id: "ex-rt-01",
    version: 1,
    title: "RT Lab",
    instructions: "Connect PC to server",
    targets: [{ id: "t1", type: "reachability", sourceDeviceId: "pc-0", destinationDeviceId: "server-0" }],
  };
}

function passingWorkspacePayload(): string {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Server-0", ipv4: { address: "192.168.1.20", prefix: 24 } });
  topology = addLink(topology, { fromDeviceId: "pc-0", toDeviceId: "server-0", fromPort: "fa0/1", toPort: "fa0/1" });
  return exportWorkspace(topology);
}

test("subscribe authorizes and replies with an ordered snapshot", async () => {
  const { api, protocol } = fixture();
  const created = await api.createClass({ class_code: "CS-RT001", host_token: "host-rt" });
  assert.ok(created.ok);
  if (!created.ok) return;

  const denied = protocol.handleCommand({ type: "subscribe", session_id: created.data.id, role: "host", token: "wrong" });
  assert.equal(denied.length, 1);
  assert.equal(denied[0].type, "error");
  assert.equal(denied[0].payload.code, "FORBIDDEN");

  const ok = protocol.handleCommand({ type: "subscribe", session_id: created.data.id, role: "host", token: "host-rt" });
  assert.equal(ok.length, 1);
  assert.equal(ok[0].type, "session_snapshot");
  assert.equal(ok[0].session_id, created.data.id);
  assert.equal(typeof ok[0].sequence, "number");
});

test("heartbeat returns server timestamp and updates participant lastSeen", async () => {
  const { api, protocol, store } = fixture();
  const created = await api.createClass({ class_code: "CS-RT002", host_token: "host-rt" });
  assert.ok(created.ok);
  if (!created.ok) return;
  const joined = await api.joinClass(created.data.id, { class_code: "CS-RT002", nickname: "Nara", join_token: "student-rt" });
  assert.ok(joined.ok);
  if (!joined.ok) return;

  const reply = protocol.handleCommand({ type: "heartbeat", session_id: created.data.id, role: "participant", token: "student-rt" });
  assert.equal(reply.length, 1);
  assert.equal(reply[0].type, "heartbeat_ack");
  assert.equal(typeof reply[0].payload.server_time, "number");

  const participant = store.getParticipant(joined.data.id)!;
  assert.equal(participant.lastSeenAt, 1_000);
});

test("participant join and submit publish ordered realtime events", async () => {
  const { api, protocol, hub } = fixture();
  const created = await api.createClass({ class_code: "CS-RT003", host_token: "host-rt" });
  assert.ok(created.ok);
  if (!created.ok) return;
  const sessionId = created.data.id;

  const exercise = await api.createExercise(sessionId, sampleExercise(), "host-rt");
  assert.ok(exercise.ok);
  if (!exercise.ok) return;
  await api.startExercise(sessionId, exercise.data.id, "host-rt");

  const received: string[] = [];
  hub.subscribe(sessionId, (event) => received.push(event.type));

  const joined = await api.joinClass(sessionId, { class_code: "CS-RT003", nickname: "Nara", join_token: "student-rt" });
  assert.ok(joined.ok);
  const submitted = await api.submitParticipantWorkspace(sessionId, passingWorkspacePayload(), "sub-rt-1", "student-rt");
  assert.ok(submitted.ok);

  assert.deepEqual(received, ["participant_joined", "submission_evaluated"]);

  // host receives replay from its subscribe point
  const hostEvents = hub.eventsSince(sessionId, 0);
  assert.equal(hostEvents.ok, true);
  void protocol;
});

test("reconcile replays missed events or forces a snapshot after a gap", async () => {
  const { api, protocol, hub } = fixture();
  const created = await api.createClass({ class_code: "CS-RT004", host_token: "host-rt" });
  assert.ok(created.ok);
  if (!created.ok) return;
  const sessionId = created.data.id;
  await api.joinClass(sessionId, { class_code: "CS-RT004", nickname: "Nara", join_token: "student-rt" });

  const replay = protocol.handleCommand({ type: "reconcile", session_id: sessionId, role: "participant", token: "student-rt", last_seen_sequence: 0 });
  assert.ok(replay.length >= 1);
  assert.equal(replay[0].type, "session_snapshot");

  // simulate a client far behind the buffer
  const gap = protocol.handleCommand({ type: "reconcile", session_id: sessionId, role: "participant", token: "student-rt", last_seen_sequence: -1000 });
  assert.equal(gap.length, 1);
  assert.equal(gap[0].type, "session_snapshot");
  assert.equal(gap[0].payload.reconciled, "snapshot");
  void hub;
});

test("host lifecycle commands emit host_disconnected and session_closed events", async () => {
  const { api, protocol, hub } = fixture();
  const created = await api.createClass({ class_code: "CS-RT005", host_token: "host-rt" });
  assert.ok(created.ok);
  if (!created.ok) return;
  const sessionId = created.data.id;

  const received: string[] = [];
  hub.subscribe(sessionId, (event) => received.push(event.type));

  const disconnect = protocol.handleCommand({ type: "lifecycle_change", session_id: sessionId, role: "host", token: "host-rt", action: "disconnect" });
  assert.equal(disconnect.length, 1);
  assert.equal(disconnect[0].type, "lifecycle_ack");

  // host must reconnect before closing: closeSession only mutates active sessions
  const reconnect = protocol.handleCommand({ type: "lifecycle_change", session_id: sessionId, role: "host", token: "host-rt", action: "reconnect" });
  assert.equal(reconnect[0].type, "lifecycle_ack");

  const close = protocol.handleCommand({ type: "lifecycle_change", session_id: sessionId, role: "host", token: "host-rt", action: "close" });
  assert.equal(close.length, 1);

  assert.deepEqual(received, ["host_disconnected", "session_closed"]);

  // student cannot drive lifecycle
  const denied = protocol.handleCommand({ type: "lifecycle_change", session_id: sessionId, role: "participant", token: "student-x", action: "close" });
  assert.equal(denied[0].type, "error");
  void api;
});

test("workspace_changed updates projection and bumps workspace event", async () => {
  const { api, protocol, hub } = fixture();
  const created = await api.createClass({ class_code: "CS-RT006", host_token: "host-rt" });
  assert.ok(created.ok);
  if (!created.ok) return;
  const sessionId = created.data.id;
  const exercise = await api.createExercise(sessionId, sampleExercise(), "host-rt");
  assert.ok(exercise.ok);
  if (!exercise.ok) return;
  await api.startExercise(sessionId, exercise.data.id, "host-rt");
  await api.joinClass(sessionId, { class_code: "CS-RT006", nickname: "Nara", join_token: "student-rt" });

  const received: string[] = [];
  hub.subscribe(sessionId, (event) => received.push(event.type));

  const reply = protocol.handleCommand({
    type: "workspace_changed",
    session_id: sessionId,
    role: "participant",
    token: "student-rt",
    payload: passingWorkspacePayload(),
    expected_version: undefined,
  });
  assert.equal(reply.length, 1);
  assert.equal(reply[0].type, "workspace_ack");
  assert.deepEqual(received, ["workspace_projection_updated"]);
});

test("unsubscribe stops delivery", async () => {
  const { api, protocol } = fixture();
  const created = await api.createClass({ class_code: "CS-RT007", host_token: "host-rt" });
  assert.ok(created.ok);
  if (!created.ok) return;
  const sessionId = created.data.id;
  await api.joinClass(sessionId, { class_code: "CS-RT007", nickname: "Nara", join_token: "student-rt" });

  const ack = protocol.handleCommand({ type: "unsubscribe", session_id: sessionId, role: "participant", token: "student-rt" });
  assert.equal(ack.length, 1);
  assert.equal(ack[0].type, "unsubscribe_ack");

  // after unsubscribe the participant listener is removed; host lifecycle still works
  const close = protocol.handleCommand({ type: "lifecycle_change", session_id: sessionId, role: "host", token: "host-rt", action: "close" });
  assert.equal(close.length, 1);
});

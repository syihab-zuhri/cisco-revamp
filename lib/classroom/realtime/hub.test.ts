import assert from "node:assert/strict";
import test from "node:test";
import { RealtimeHub, REALTIME_EVENT_BUFFER } from "./hub.ts";

test("hub assigns monotonic per-session sequence numbers", () => {
  const hub = new RealtimeHub();
  const first = hub.publish("s1", { type: "participant_joined", payload: { participant_id: "p1" } });
  const second = hub.publish("s1", { type: "participant_presence_changed", payload: { participant_id: "p1", status: "working" } });
  const other = hub.publish("s2", { type: "session_closed", payload: {} });

  assert.equal(first.sequence, 1);
  assert.equal(second.sequence, 2);
  assert.equal(other.sequence, 1, "sequence is per-session");
});

test("snapshot includes status and current sequence", () => {
  const hub = new RealtimeHub();
  hub.publish("s1", { type: "participant_joined", payload: { participant_id: "p1" } });
  const snapshot = hub.snapshot("s1", { status: "active", participants: [{ id: "p1", nickname: "Nara", status: "working" }] });

  assert.equal(snapshot.type, "session_snapshot");
  assert.equal(snapshot.sequence, 1);
  assert.deepEqual(snapshot.payload.status, "active");
  assert.deepEqual(snapshot.payload.participants, [{ id: "p1", nickname: "Nara", status: "working" }]);
});

test("eventsSince replays only events after the requested sequence", () => {
  const hub = new RealtimeHub();
  hub.publish("s1", { type: "participant_joined", payload: { participant_id: "p1" } });
  hub.publish("s1", { type: "participant_joined", payload: { participant_id: "p2" } });
  hub.publish("s1", { type: "participant_presence_changed", payload: { participant_id: "p1", status: "submitted" } });

  const missed = hub.eventsSince("s1", 1);
  assert.equal(missed.ok, true);
  if (missed.ok) {
    assert.deepEqual(missed.events.map((event) => event.sequence), [2, 3]);
  }
});

test("eventsSince reports a gap when the client fell behind the buffer", () => {
  const hub = new RealtimeHub();
  for (let i = 0; i < REALTIME_EVENT_BUFFER + 5; i += 1) {
    hub.publish("s1", { type: "participant_presence_changed", payload: { participant_id: `p${i}` } });
  }
  const missed = hub.eventsSince("s1", 1);
  assert.equal(missed.ok, false);
  if (!missed.ok) assert.equal(missed.reason, "gap");
});

test("subscribers receive published events until unsubscribed", () => {
  const hub = new RealtimeHub();
  const received: string[] = [];
  const unsubscribe = hub.subscribe("s1", (event) => received.push(event.type));

  hub.publish("s1", { type: "participant_joined", payload: {} });
  unsubscribe();
  hub.publish("s1", { type: "session_closed", payload: {} });

  assert.deepEqual(received, ["participant_joined"]);
});

import assert from "node:assert/strict";
import test from "node:test";
import { POST as createClass } from "../../app/api/v1/class-sessions/route.ts";
import { POST as joinClass } from "../../app/api/v1/class-sessions/[id]/join/route.ts";
import { POST as createExercise } from "../../app/api/v1/class-sessions/[id]/exercises/route.ts";
import { POST as startExercise } from "../../app/api/v1/class-sessions/[id]/exercises/[eid]/start/route.ts";
import { GET as getActiveExercise } from "../../app/api/v1/class-sessions/[id]/exercises/active/route.ts";
import { POST as submitWorkspace } from "../../app/api/v1/class-sessions/[id]/submit/route.ts";
import { GET as getResults } from "../../app/api/v1/class-sessions/[id]/results/route.ts";
import { GET as getPreview } from "../../app/api/v1/class-sessions/[id]/results/preview/route.ts";
import { exportWorkspace } from "./../simulator/workspace.ts";
import { addDevice, addLink, createTopology } from "./../simulator/core.ts";
import type { Exercise } from "./../simulator/exercise.ts";

const json = (value: unknown, token?: string) =>
  new Request("http://localhost/api", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(value),
  });

function sampleExercise(): Exercise {
  return {
    id: "ex-lan-01",
    version: 1,
    title: "LAN Setup",
    instructions: "Configure PC and Server with valid IPs and link them through Switch",
    targets: [
      { id: "t1", type: "device_config", deviceId: "pc-0", address: "192.168.1.10", prefix: 24 },
      { id: "t2", type: "reachability", sourceDeviceId: "pc-0", destinationDeviceId: "server-0" },
    ],
  };
}

function passingTopology() {
  let topology = createTopology();
  topology = addDevice(topology, { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } });
  topology = addDevice(topology, { id: "switch-0", type: "switch", label: "Switch-0" });
  topology = addDevice(topology, { id: "server-0", type: "server", label: "Server-0", ipv4: { address: "192.168.1.20", prefix: 24 } });
  topology = addLink(topology, { fromDeviceId: "pc-0", toDeviceId: "switch-0", fromPort: "fa0/1", toPort: "fa0/1" });
  topology = addLink(topology, { fromDeviceId: "switch-0", toDeviceId: "server-0", fromPort: "fa0/2", toPort: "fa0/1" });
  return topology;
}

test("E2E classroom join-to-review flow executes end-to-end", async () => {
  const hostToken = "host-secret-flow-01";
  const studentToken = "student-secret-flow-01";
  const classCode = "CS-E2E001";

  // 1. Teacher creates classroom session
  const createdRes = await createClass(json({ class_code: classCode, host_token: hostToken }));
  assert.equal(createdRes.status, 201);
  const created = await createdRes.json();
  const sessionId = created.data.id as string;

  // 2. Teacher creates exercise
  const exerciseRes = await createExercise(json({ exercise: sampleExercise() }, hostToken), { params: Promise.resolve({ id: sessionId }) });
  assert.equal(exerciseRes.status, 201);
  const exerciseData = await exerciseRes.json();
  const exerciseId = exerciseData.data.id as string;

  // 3. Teacher starts exercise
  const startRes = await startExercise(
    new Request("http://localhost/api", { method: "POST", headers: { authorization: `Bearer ${hostToken}` } }),
    { params: Promise.resolve({ id: sessionId, eid: exerciseId }) },
  );
  assert.equal(startRes.status, 200);

  // 4. Student joins with class code
  const joinRes = await joinClass(json({ class_code: classCode, nickname: "Zuhri Student", join_token: studentToken }), { params: Promise.resolve({ id: sessionId }) });
  assert.equal(joinRes.status, 201);
  const joinData = await joinRes.json();
  const participantId = joinData.data.id as string;

  // 5. Student reads active exercise
  const activeExRes = await getActiveExercise(
    new Request(`http://localhost/api?role=participant`, { headers: { authorization: `Bearer ${studentToken}` } }),
    { params: Promise.resolve({ id: sessionId }) },
  );
  assert.equal(activeExRes.status, 200);
  const activeEx = await activeExRes.json();
  assert.equal(activeEx.data.exercise.title, "LAN Setup");

  // 6. Student submits passing workspace
  const workspacePayload = exportWorkspace(passingTopology());
  const submitRes = await submitWorkspace(
    json({ payload: workspacePayload, submission_key: "sub-key-01" }, studentToken),
    { params: Promise.resolve({ id: sessionId }) },
  );
  assert.equal(submitRes.status, 201);
  const submitData = await submitRes.json();
  assert.equal(submitData.data.evaluation.status, "passed");
  assert.equal(submitData.data.evaluation.score, 100);

  // 7. Teacher reviews results projection
  const resultsRes = await getResults(
    new Request("http://localhost/api", { headers: { authorization: `Bearer ${hostToken}` } }),
    { params: Promise.resolve({ id: sessionId }) },
  );
  assert.equal(resultsRes.status, 200);
  const results = await resultsRes.json();
  assert.equal(results.data.length, 1);
  assert.equal(results.data[0].nickname, "Zuhri Student");
  assert.equal(results.data[0].status, "submitted");
  assert.equal(results.data[0].submission.score, 100);

  // 8. Teacher previews participant workspace
  const previewRes = await getPreview(
    new Request(`http://localhost/api?participant_id=${participantId}`, { headers: { authorization: `Bearer ${hostToken}` } }),
    { params: Promise.resolve({ id: sessionId }) },
  );
  assert.equal(previewRes.status, 200);
  const preview = await previewRes.json();
  assert.equal(preview.data.devices.length, 3);
  assert.equal(preview.data.links.length, 2);
});

test("student cannot start exercise or read results", async () => {
  const hostToken = "host-secret-flow-02";
  const studentToken = "student-secret-flow-02";
  const classCode = "CS-E2E002";

  const createdRes = await createClass(json({ class_code: classCode, host_token: hostToken }));
  const created = await createdRes.json();
  const sessionId = created.data.id as string;

  const joinRes = await joinClass(json({ class_code: classCode, nickname: "Unauthorized Student", join_token: studentToken }), { params: Promise.resolve({ id: sessionId }) });
  assert.equal(joinRes.status, 201);

  // Student attempts to fetch teacher results -> FORBIDDEN
  const resultsRes = await getResults(
    new Request("http://localhost/api", { headers: { authorization: `Bearer ${studentToken}` } }),
    { params: Promise.resolve({ id: sessionId }) },
  );
  assert.equal(resultsRes.status, 403);
});

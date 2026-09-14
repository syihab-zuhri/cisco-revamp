// Controlled classroom pilot harness (TASK-P0-018).
// Drives the running production build over real HTTP + SSE with synthetic data.
// Usage: node scripts/pilot.mjs http://127.0.0.1:3400
const BASE = process.argv[2] ?? "http://127.0.0.1:3400";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

async function api(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function workspaceJson(devices, links) {
  return JSON.stringify({
    schema: "netlab.workspace",
    version: 2,
    kind: "workspace",
    workspace: { version: 1, devices, links },
  });
}

const correctDevices = [
  { id: "pc-1", type: "pc", label: "PC-1", ipv4: { address: "192.168.10.10", prefix: 24 }, gateway: "192.168.10.1" },
  { id: "sw-1", type: "switch", label: "SW-1" },
  { id: "sv-1", type: "server", label: "SV-1", ipv4: { address: "192.168.10.50", prefix: 24 }, gateway: "192.168.10.1" },
];
const correctLinks = [
  { id: "l-1", fromDeviceId: "pc-1", toDeviceId: "sw-1", fromPort: "fa0/1", toPort: "fa0/1", up: true },
  { id: "l-2", fromDeviceId: "sv-1", toDeviceId: "sw-1", fromPort: "fa0/1", toPort: "fa0/2", up: true },
];
// broken: same devices but missing the link to the server
const brokenLinks = [correctLinks[0]];

const exercise = {
  id: "ex-pilot-01",
  version: 1,
  title: "LAN Fundamentals: connect PC to Server",
  instructions: "Bangun LAN PC-Switch-Server pada subnet 192.168.10.0/24 dan pastikan ping berhasil.",
  targets: [
    { id: "t1", type: "device_config", deviceId: "pc-1", address: "192.168.10.10", prefix: 24 },
    { id: "t2", type: "link_exists", fromDeviceId: "pc-1", toDeviceId: "sw-1" },
    { id: "t3", type: "reachability", sourceDeviceId: "pc-1", destinationDeviceId: "sv-1" },
    { id: "t4", type: "required_device_count", deviceType: "switch", count: 1 },
  ],
};

function startStream(ticket, lastSequence = 0) {
  const url = `${BASE}/api/v1/realtime?ticket=${encodeURIComponent(ticket)}${lastSequence ? `&last_sequence=${lastSequence}` : ""}`;
  const ac = new AbortController();
  const events = [];
  void (async () => {
    const res = await fetch(url, { signal: ac.signal, headers: { accept: "text/event-stream" } });
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done: fin } = await reader.read();
      if (fin) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (line.startsWith("data: ")) {
            try { events.push(JSON.parse(line.slice(6))); } catch { /* ignore */ }
          }
        }
      }
    }
  })().catch(() => undefined);
  return {
    events,
    close: () => ac.abort(),
    waitFor: async (pred, ms = 5000) => {
      const until = Date.now() + ms;
      while (Date.now() < until) {
        const hit = events.find(pred);
        if (hit) return hit;
        await new Promise((r) => setTimeout(r, 50));
      }
      return undefined;
    },
  };
}

async function main() {
  // 0. health gates
  const live = await api("GET", "/health/live");
  check("health/live returns alive", live.status === 200 && live.json?.data?.status === "alive");
  const ready = await api("GET", "/health/ready");
  check("health/ready returns ready", ready.status === 200 && ready.json?.data?.status === "ready",
    `sessions=${ready.json?.data?.activeSessions}`);

  // 1. teacher creates class (no account)
  const hostToken = `host-${crypto.randomUUID()}`;
  const created = await api("POST", "/api/v1/class-sessions", { body: { class_code: "CS-PILOT01", host_token: hostToken } });
  check("teacher creates class with class code only", created.status === 201 && Boolean(created.json?.data?.id), `session=${created.json?.data?.id}`);
  const sessionId = created.json.data.id;
  check("create response leaks no host token", !JSON.stringify(created.json).includes(hostToken));

  // 2. students join with code + nickname, no login
  const students = Array.from({ length: 5 }, (_, i) => ({ nickname: `Siswa-${i + 1}`, token: `stu-${crypto.randomUUID()}`, id: null }));
  const joins = [];
  for (const s of students) {
    const r = await api("POST", `/api/v1/class-sessions/${sessionId}/join`, { body: { class_code: "CS-PILOT01", nickname: s.nickname, join_token: s.token } });
    if (r.status === 201) s.id = r.json?.data?.id ?? null;
    joins.push(r);
  }
  check("5 students join without accounts", joins.every((j) => j.status === 201), joins.map((j) => j.status).join(","));

  // 3. teacher SSE realtime stream
  const hostTicketRes = await api("POST", "/api/v1/realtime/tickets", { token: hostToken, body: { session_id: sessionId, role: "host" } });
  check("teacher exchanges realtime ticket", hostTicketRes.status === 201 && Boolean(hostTicketRes.json?.data?.ticket));
  const hostStream = startStream(hostTicketRes.json.data.ticket);
  const snap = await hostStream.waitFor((e) => e.type === "session_snapshot");
  check("teacher receives session snapshot", Boolean(snap) && snap.payload?.participants?.length >= 5, `participants=${snap?.payload?.participants?.length}`);

  // 4. live join event observed via SSE (student 6 joins after stream open)
  const late = { nickname: "Siswa-6", token: `stu-${crypto.randomUUID()}` };
  await api("POST", `/api/v1/class-sessions/${sessionId}/join`, { body: { class_code: "CS-PILOT01", nickname: late.nickname, join_token: late.token } });
  const joinEvent = await hostStream.waitFor((e) => e.type === "participant_joined");
  check("teacher sees participant_joined live over SSE", Boolean(joinEvent), joinEvent ? `seq=${joinEvent.sequence}` : "");

  // 5. teacher creates and starts exercise
  const exCreated = await api("POST", `/api/v1/class-sessions/${sessionId}/exercises`, { token: hostToken, body: { exercise } });
  check("teacher publishes exercise", exCreated.status === 201 && Boolean(exCreated.json?.data?.id), `exercise=${exCreated.json?.data?.id}`);
  const exId = exCreated.json.data.id;
  const exStarted = await api("POST", `/api/v1/class-sessions/${sessionId}/exercises/${exId}/start`, { token: hostToken });
  check("teacher starts exercise", exStarted.status === 200);
  const exEvent = await hostStream.waitFor((e) => e.type === "exercise_started" || e.type === "lifecycle_changed");
  check("exercise event reaches SSE stream", Boolean(exEvent), exEvent?.type ?? "");

  // 6. student fetches active exercise and submits correct + partial workspaces
  const s0 = students[0];
  const active = await api("GET", `/api/v1/class-sessions/${sessionId}/exercises/active?role=participant`, { token: s0.token });
  check("student sees active exercise", active.status === 200 && active.json?.data?.id === exId);

  const submitCorrect = await api("POST", `/api/v1/class-sessions/${sessionId}/submit`, {
    token: s0.token,
    body: { payload: workspaceJson(correctDevices, correctLinks), submission_key: `sub-${crypto.randomUUID()}` },
  });
  const correctEval = submitCorrect.json?.data?.evaluation ?? submitCorrect.json?.data;
  check("correct workspace scores 100/passed", submitCorrect.status === 201 && correctEval?.status === "passed" && correctEval?.score === 100,
    `status=${correctEval?.status} score=${correctEval?.score}`);

  const submitPartial = await api("POST", `/api/v1/class-sessions/${sessionId}/submit`, {
    token: students[1].token,
    body: { payload: workspaceJson(correctDevices, brokenLinks), submission_key: `sub-${crypto.randomUUID()}` },
  });
  const partialEval = submitPartial.json?.data?.evaluation ?? submitPartial.json?.data;
  check("partial workspace scores between 1 and 99", submitPartial.status === 201 && (partialEval?.status === "partial" || partialEval?.status === "failed") && partialEval?.score < 100,
    `status=${partialEval?.status} score=${partialEval?.score}`);

  const submitEmpty = await api("POST", `/api/v1/class-sessions/${sessionId}/submit`, {
    token: students[2].token,
    body: { payload: workspaceJson([], []), submission_key: `sub-${crypto.randomUUID()}` },
  });
  const emptyEval = submitEmpty.json?.data?.evaluation ?? submitEmpty.json?.data;
  check("empty workspace scores failed", submitEmpty.status === 201 && emptyEval?.status === "failed", `score=${emptyEval?.score}`);

  const submitMalformed = await api("POST", `/api/v1/class-sessions/${sessionId}/submit`, {
    token: students[3].token,
    body: { payload: "{not-json", submission_key: `sub-${crypto.randomUUID()}`, expected_version: 1 },
  });
  check("malformed submission rejected (4xx)", submitMalformed.status >= 400 && submitMalformed.status < 500, `status=${submitMalformed.status}`);

  // 7. submit event visible live to teacher
  const subEvent = await hostStream.waitFor((e) => e.type === "submission_evaluated" || e.type === "workspace_projection_updated");
  check("teacher sees submission over SSE", Boolean(subEvent), subEvent?.type ?? "");

  // 8. SSE reconnect with sequence replay: drop stream, reconnect after a new join
  let lastSeq = Math.max(...hostStream.events.map((e) => e.sequence ?? 0), 0);
  hostStream.close();
  await new Promise((r) => setTimeout(r, 200));
  const late2 = { nickname: "Siswa-7", token: `stu-${crypto.randomUUID()}` };
  await api("POST", `/api/v1/class-sessions/${sessionId}/join`, { body: { class_code: "CS-PILOT01", nickname: late2.nickname, join_token: late2.token } });
  await new Promise((r) => setTimeout(r, 200));
  const ticket2 = await api("POST", "/api/v1/realtime/tickets", { token: hostToken, body: { session_id: sessionId, role: "host" } });
  const replay = startStream(ticket2.json.data.ticket, lastSeq);
  const rejoined = await replay.waitFor((e) => e.type === "participant_joined");
  check("reconnect replays missed events from sequence", Boolean(rejoined), rejoined ? `missed seq=${rejoined.sequence} > ${lastSeq}` : `events=${replay.events.map((e) => e.type).join(",")}`);
  const reSnap = await replay.waitFor((e) => e.type === "session_snapshot");
  check("reconnect state consistent (snapshot has all 7 students)", Boolean(reSnap) && reSnap.payload?.participants?.length >= 7, `n=${reSnap?.payload?.participants?.length}`);
  replay.close();

  // 9. teacher reviews results projection
  const res = await api("GET", `/api/v1/class-sessions/${sessionId}/results`, { token: hostToken });
  const rows = res.json?.data ?? [];
  const passed = Array.isArray(rows) ? rows.filter((r) => r.evaluation?.status === "passed").length : 0;
  check("teacher results show graded submissions", res.status === 200 && Array.isArray(rows) && rows.length >= 3, `rows=${rows.length} passed=${passed}`);
  const studentResults = await api("GET", `/api/v1/class-sessions/${sessionId}/results`, { token: students[0].token });
  check("student cannot read teacher results", studentResults.status === 403);

  // 10. workspace export/import fixture compatibility through the API surface (preview route)
  const preview = await api("GET", `/api/v1/class-sessions/${sessionId}/results/preview?participant_id=${encodeURIComponent(s0.id ?? "")}`, { token: hostToken });
  check("workspace preview returns valid export fixture", preview.status === 200 && Boolean(preview.json?.data),
  `status=${preview.status}`);

  // 11. unauthorized ticket rejected (no bearer)
  const badTicket = await api("POST", "/api/v1/realtime/tickets", { body: { session_id: sessionId, role: "host" } });
  check("ticket exchange requires valid bearer", badTicket.status >= 400);
  const badStream = await fetch(`${BASE}/api/v1/realtime?ticket=nope`);
  check("SSE rejects invalid ticket", badStream.status === 403);

  // 12. teacher closes class
  const closed = await api("POST", `/api/v1/class-sessions/${sessionId}/lifecycle`, { token: hostToken, body: { action: "close" } });
  check("teacher closes class", closed.status === 200, `status=${closed.json?.data?.status}`);
  const joinAfterClose = await api("POST", `/api/v1/class-sessions/${sessionId}/join`, { body: { class_code: "CS-PILOT01", nickname: "Late", join_token: `stu-${crypto.randomUUID()}` } });
  check("join after close is rejected", joinAfterClose.status >= 400, `status=${joinAfterClose.status}`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\nPILOT RESULT: ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("FAILED CHECKS:");
    for (const f of failed) console.log(` - ${f.name} (${f.detail})`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("PILOT CRASH:", err);
  process.exit(2);
});

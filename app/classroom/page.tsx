"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ResultItem = {
  participant_id: string;
  nickname: string;
  status: "not_started" | "in_progress" | "submitted";
  submission: {
    score: number;
    status: "passed" | "partial" | "failed";
    feedback: string;
    submitted_at: number;
  } | null;
};

function generateStudentToken(): string {
  return `student-${crypto.randomUUID().slice(0, 8)}`;
}

function generateSubmissionKey(): string {
  return `sub-${crypto.randomUUID()}`;
}

export default function ClassroomPage() {
  const [role, setRole] = useState<"teacher" | "student">("teacher");

  // Teacher State
  const [classCode, setClassCode] = useState("CS-DEMO01");
  const [hostToken, setHostToken] = useState("host-secret-demo");
  const [createdSessionId, setCreatedSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [teacherLog, setTeacherLog] = useState<string[]>([]);
  const [isClassActive, setIsClassActive] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Student State
  const [joinCode, setJoinCode] = useState("CS-DEMO01");
  const [nickname, setNickname] = useState("");
  const [studentToken, setStudentToken] = useState("");
  const [joinedSessionId, setJoinedSessionId] = useState<string | null>(null);
  const [myParticipantId, setMyParticipantId] = useState<string | null>(null);
  const [activeExerciseTitle, setActiveExerciseTitle] = useState<string | null>(null);
  const [mySubmission, setMySubmission] = useState<{ score: number; status: string; feedback: string } | null>(null);
  const [studentLog, setStudentLog] = useState<string[]>([]);

  // Teacher Actions
  async function handleCreateClass() {
    try {
      const res = await fetch("/api/v1/class-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ class_code: classCode, host_token: hostToken }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error.message);
      setCreatedSessionId(data.data.id);
      setIsClassActive(true);
      logTeacher(`Class created: ${classCode} (Session: ${data.data.id.slice(0, 8)}...)`);

      // Otomatis buat & start exercise default agar siap dikerjakan siswa
      const exRes = await fetch(`/api/v1/class-sessions/${data.data.id}/exercises`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${hostToken}`,
        },
        body: JSON.stringify({
          exercise: {
            id: "ex-lan-default",
            version: 1,
            title: "Tantangan 01: Koneksi LAN Dasar",
            instructions: "Konfigurasikan PC-0 dan Server-0 pada subnet 192.168.1.0/24 lalu hubungkan via Switch-0.",
            targets: [
              { id: "t1", type: "device_config", deviceId: "pc-0", address: "192.168.1.10", prefix: 24 },
              { id: "t2", type: "reachability", sourceDeviceId: "pc-0", destinationDeviceId: "server-0" },
            ],
          },
        }),
      });
      const exData = await exRes.json();
      if (exData.ok) {
        await fetch(`/api/v1/class-sessions/${data.data.id}/exercises/${exData.data.id}/start`, {
          method: "POST",
          headers: { authorization: `Bearer ${hostToken}` },
        });
        logTeacher(`Exercise default "Tantangan 01" diaktifkan.`);
      }

      // connect live SSE stream for real-time presence/results
      connectTeacherRealtime(data.data.id, hostToken);
    } catch (err: unknown) {
      logTeacher(`Error create: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleRefreshResults() {
    if (!createdSessionId) return;
    try {
      const res = await fetch(`/api/v1/class-sessions/${createdSessionId}/results`, {
        headers: { authorization: `Bearer ${hostToken}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error.message);
      setResults(data.data);
      logTeacher(`Data hasil diperbarui: ${data.data.length} peserta tercatat.`);
    } catch (err: unknown) {
      logTeacher(`Gagal memuat hasil: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleCloseClass() {
    if (!createdSessionId) return;
    try {
      const res = await fetch(`/api/v1/class-sessions/${createdSessionId}/lifecycle`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${hostToken}`,
        },
        body: JSON.stringify({ action: "close" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error.message);
      setIsClassActive(false);
      logTeacher(`Sesi kelas ditutup oleh guru.`);
    } catch (err: unknown) {
      logTeacher(`Gagal menutup: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Student Actions
  async function handleJoinClass() {
    if (!nickname.trim()) {
      logStudent("Nama panggilan wajib diisi.");
      return;
    }
    const token = generateStudentToken();
    setStudentToken(token);

    try {
      // Cari sesi atau gunakan id sesi jika ada, atau buat join via helper
      // Untuk MVP kita butuh sessionId. Jika ada sesi yang aktif dari create, gunakan.
      const sessionId = createdSessionId ?? "unknown";
      const res = await fetch(`/api/v1/class-sessions/${sessionId}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          class_code: joinCode,
          nickname: nickname.trim(),
          join_token: token,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error.message);
      setJoinedSessionId(sessionId);
      setMyParticipantId(data.data.id);
      logStudent(`Berhasil bergabung sebagai ${data.data.nickname}!`);

      // Cek exercise aktif
      const exRes = await fetch(`/api/v1/class-sessions/${sessionId}/exercises/active?role=participant`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const exData = await exRes.json();
      if (exData.ok && exData.data) {
        setActiveExerciseTitle(exData.data.exercise.title);
        logStudent(`Exercise aktif: ${exData.data.exercise.title}`);
      }
    } catch (err: unknown) {
      logStudent(`Gagal bergabung: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async function handleSubmitCurrentWorkspace() {
    if (!joinedSessionId || !studentToken) return;
    try {
      // Mengirim payload workspace default lulus
      const defaultTopology = {
        schema: "netlab.workspace",
        version: 2,
        kind: "workspace",
        created_at: new Date().toISOString(),
        workspace: {
          version: 1,
          devices: [
            { id: "pc-0", type: "pc", label: "PC-0", ipv4: { address: "192.168.1.10", prefix: 24 } },
            { id: "switch-0", type: "switch", label: "Switch-0" },
            { id: "server-0", type: "server", label: "Server-0", ipv4: { address: "192.168.1.20", prefix: 24 } },
          ],
          links: [
            { id: "l1", fromDeviceId: "pc-0", toDeviceId: "switch-0", fromPort: "fa0/1", toPort: "fa0/1", up: true },
            { id: "l2", fromDeviceId: "switch-0", toDeviceId: "server-0", fromPort: "fa0/2", toPort: "fa0/1", up: true },
          ],
        },
      };

      const res = await fetch(`/api/v1/class-sessions/${joinedSessionId}/submit`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          payload: JSON.stringify(defaultTopology),
          submission_key: generateSubmissionKey(),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error.message);
      setMySubmission({
        score: data.data.evaluation.score,
        status: data.data.evaluation.status,
        feedback: data.data.evaluation.feedback,
      });
      logStudent(`Workspace berhasil dikumpulkan! Nilai: ${data.data.evaluation.score}/100 (${data.data.evaluation.status})`);
    } catch (err: unknown) {
      logStudent(`Gagal mengumpulkan: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function connectTeacherRealtime(sessionId: string, token: string) {
    fetch("/api/v1/realtime/tickets", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ session_id: sessionId, role: "host" }),
    })
      .then((res) => res.json())
      .then((ticketRes) => {
        if (!ticketRes.ok) return;
        const source = new EventSource(`/api/v1/realtime?ticket=${ticketRes.data.ticket}`);
        source.onopen = () => setRealtimeConnected(true);
        source.onerror = () => setRealtimeConnected(false);
        source.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "participant_joined") {
              logTeacher(`Realtime: ${data.payload.nickname} bergabung.`);
              handleRefreshResults();
            } else if (data.type === "submission_evaluated") {
              logTeacher(`Realtime: Pengumpulan dinilai (${data.payload.score}/100).`);
              handleRefreshResults();
            } else if (data.type === "host_disconnected") {
              logTeacher("Realtime: Host disconnected.");
            } else if (data.type === "session_closed") {
              setIsClassActive(false);
              setRealtimeConnected(false);
              source.close();
            }
          } catch {
            /* ignore parse error */
          }
        };
      })
      .catch(() => undefined);
  }

  function logTeacher(msg: string) {
    setTeacherLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }

  function logStudent(msg: string) {
    setStudentLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }

  return (
    <main className="min-h-screen bg-[#f8f9fa] text-[#0a0a0a]">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-[#0a0a0a] bg-white px-7">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center bg-[#e01a1a] text-lg font-black text-white">N.</span>
            <div>
              <p className="font-heading text-xl font-black tracking-tight">NETLAB</p>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#718096]">Classroom Portal</p>
            </div>
          </Link>
          <div className="h-8 w-px bg-[#e2e8f0]" />
          <div className="flex gap-2">
            <button
              onClick={() => setRole("teacher")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                role === "teacher" ? "bg-[#0a0a0a] text-white" : "text-[#718096] hover:text-[#0a0a0a]"
              }`}
            >
              Mode Guru (Host)
            </button>
            <button
              onClick={() => setRole("student")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
                role === "student" ? "bg-[#0a0a0a] text-white" : "text-[#718096] hover:text-[#0a0a0a]"
              }`}
            >
              Mode Siswa (Peserta)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="secondary" size="sm">← Kembali ke Simulator</Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl p-8">
        {role === "teacher" ? (
          <div className="space-y-6">
            <div className="border border-[#0a0a0a] bg-white p-6">
              <h2 className="text-xl font-heading font-black">Kontrol Kelas Guru</h2>
              <p className="text-xs text-[#718096] mt-1">Buka kelas live dan bagikan kode kelas kepada siswa di lab.</p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#718096] mb-1">Kode Kelas</label>
                  <input
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    disabled={isClassActive}
                    className="w-full h-10 border border-[#cbd5e1] px-3 font-mono-netlab text-sm outline-none focus:border-[#e01a1a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#718096] mb-1">Kredensial Rahasia Host</label>
                  <input
                    type="password"
                    value={hostToken}
                    onChange={(e) => setHostToken(e.target.value)}
                    disabled={isClassActive}
                    className="w-full h-10 border border-[#cbd5e1] px-3 font-mono-netlab text-sm outline-none focus:border-[#e01a1a]"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {!isClassActive ? (
                  <Button onClick={handleCreateClass} className="bg-[#e01a1a] text-white hover:bg-[#c01515]">
                    + Buat Sesi Kelas Baru
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleRefreshResults} variant="secondary">
                      ↻ Refresh Peserta & Nilai
                    </Button>
                    <Button onClick={handleCloseClass} variant="destructive">
                      ✕ Tutup Sesi Kelas
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Monitoring Panel */}
            <div className="border border-[#0a0a0a] bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-heading font-black">Peserta & Hasil Evaluasi (Live)</h3>
                  <p className="text-xs text-[#718096]">Status pengumpulan dan skor latihan siswa secara server-authoritative.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${realtimeConnected ? "bg-[#dcfce7] border-[#86efac] text-[#16a34a]" : "bg-[#f1f5f9] border-[#e2e8f0] text-[#718096]"}`}>
                    <span className={`size-1.5 rounded-full ${realtimeConnected ? "bg-[#16a34a] animate-pulse" : "bg-[#94a3b8]"}`} />
                    {realtimeConnected ? "Realtime SSE Aktif" : "Polling"}
                  </span>
                  <span className="text-xs font-bold font-mono-netlab bg-[#f1f5f9] px-2.5 py-1 border border-[#e2e8f0]">
                    {results.length} Siswa Terdaftar
                  </span>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#0a0a0a] bg-[#f8f9fa] font-mono-netlab uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Nama Siswa</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Skor</th>
                      <th className="py-2.5 px-3">Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] font-mono-netlab">
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-[#718096]">
                          Belum ada data peserta. Buat kelas atau klik tombol Refresh.
                        </td>
                      </tr>
                    ) : (
                      results.map((item) => (
                        <tr key={item.participant_id} className="hover:bg-[#f8f9fa]">
                          <td className="py-2.5 px-3 font-bold">{item.nickname}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === "submitted"
                                  ? "bg-[#dcfce7] text-[#16a34a]"
                                  : item.status === "in_progress"
                                  ? "bg-[#fef3c7] text-[#d97706]"
                                  : "bg-[#f1f5f9] text-[#718096]"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {item.submission ? `${item.submission.score}/100` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-[#4a5568]">
                            {item.submission ? item.submission.feedback : "Menunggu pengumpulan"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Log Guru */}
            <div className="border border-[#0a0a0a] bg-[#0a0a0a] p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Aktivitas Host</p>
              <div className="space-y-1 font-mono-netlab text-xs max-h-32 overflow-y-auto">
                {teacherLog.length === 0 ? (
                  <p className="text-[#94a3b8]">Belum ada aktivitas.</p>
                ) : (
                  teacherLog.map((log, i) => <p key={i}>{log}</p>)
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Student View */
          <div className="space-y-6">
            <div className="border border-[#0a0a0a] bg-white p-6">
              <h2 className="text-xl font-heading font-black">Masuk Kelas Lab</h2>
              <p className="text-xs text-[#718096] mt-1">Masukkan kode kelas dari guru dan nama panggilanmu.</p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#718096] mb-1">Kode Kelas</label>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    disabled={Boolean(joinedSessionId)}
                    className="w-full h-10 border border-[#cbd5e1] px-3 font-mono-netlab text-sm outline-none focus:border-[#e01a1a]"
                    placeholder="misal CS-DEMO01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#718096] mb-1">Nama Panggilan</label>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    disabled={Boolean(joinedSessionId)}
                    className="w-full h-10 border border-[#cbd5e1] px-3 text-sm outline-none focus:border-[#e01a1a]"
                    placeholder="misal Budi"
                  />
                </div>
              </div>

              <div className="mt-6">
                {!joinedSessionId ? (
                  <Button onClick={handleJoinClass} className="bg-[#e01a1a] text-white hover:bg-[#c01515]">
                    Gabung Kelas Sekarang →
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#dcfce7] border border-[#86efac] text-[#16a34a] text-xs font-bold rounded">
                      <span className="size-2 rounded-full bg-[#16a34a]" /> Terhubung: {nickname} (ID: {myParticipantId?.slice(0, 8)})
                    </span>
                    <Button onClick={handleSubmitCurrentWorkspace} className="bg-[#0a0a0a] text-white">
                      Kumpulkan Topologi Saya Untuk Dinilai
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Student Exercise Panel */}
            {joinedSessionId && (
              <div className="border border-[#0a0a0a] bg-white p-6">
                <h3 className="text-lg font-heading font-black">Soal Lab Yang Sedang Aktif</h3>
                <p className="text-xs font-mono-netlab text-[#e01a1a] mt-0.5">{activeExerciseTitle ?? "Memuat soal..."}</p>

                <div className="mt-4 border border-[#e2e8f0] bg-[#f8f9fa] p-4 text-xs">
                  <p className="font-bold text-[#0a0a0a] mb-1">Instruksi Guru:</p>
                  <p className="text-[#4a5568]">
                    Susun topologi di simulator (atau gunakan simulasi lokal), pastikan IP address dan konektivitas memenuhi kriteria, lalu klik tombol kumpulkan di atas.
                  </p>
                </div>

                {mySubmission && (
                  <div className="mt-4 border-2 border-[#0a0a0a] p-4 bg-white">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#718096]">Hasil Penilaian Otomatis</p>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="text-3xl font-black font-heading text-[#e01a1a]">{mySubmission.score}</span>
                      <span className="text-xs font-mono-netlab text-[#718096]">/ 100</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${mySubmission.status === "passed" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fef3c7] text-[#d97706]"}`}>
                        {mySubmission.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#4a5568] mt-2">{mySubmission.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {/* Log Siswa */}
            <div className="border border-[#0a0a0a] bg-[#0a0a0a] p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-2">Aktivitas Siswa</p>
              <div className="space-y-1 font-mono-netlab text-xs max-h-32 overflow-y-auto">
                {studentLog.length === 0 ? (
                  <p className="text-[#94a3b8]">Belum ada aktivitas.</p>
                ) : (
                  studentLog.map((log, i) => <p key={i}>{log}</p>)
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

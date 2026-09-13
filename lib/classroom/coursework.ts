import { randomUUID } from "node:crypto";
import type { Topology } from "../simulator/core.ts";
import { evaluateExercise, validateExercise, type Exercise, type ExerciseEvaluation } from "../simulator/exercise.ts";
import { importWorkspace } from "../simulator/workspace.ts";
import { ClassroomSessionStore } from "./session.ts";

export type ExerciseStatus = "draft" | "ready" | "active" | "locked" | "closed";

export type StoredExercise = {
  id: string;
  sessionId: string;
  exercise: Exercise;
  status: ExerciseStatus;
  createdAt: number;
  updatedAt: number;
};

export type StoredWorkspace = {
  id: string;
  participantId: string;
  exerciseId: string;
  topology: Topology;
  updatedAt: number;
};

export type StoredSubmission = {
  id: string;
  workspaceId: string;
  participantId: string;
  exerciseId: string;
  submissionKey: string;
  workspaceVersion: number;
  evaluation: ExerciseEvaluation;
  submittedAt: number;
};

export type ResultProjection = {
  participant_id: string;
  nickname: string;
  exercise_id: string;
  status: "not_started" | "in_progress" | "submitted";
  workspace_version: number | null;
  submission: {
    score: number;
    status: ExerciseEvaluation["status"];
    feedback: string;
    checks: ExerciseEvaluation["checks"];
    submitted_at: number;
  } | null;
};

type Clock = { now: () => number };

export class CourseworkStore {
  private readonly exercises = new Map<string, StoredExercise>();
  private readonly workspaces = new Map<string, StoredWorkspace>();
  private readonly submissions = new Map<string, StoredSubmission>();
  private readonly sessions: ClassroomSessionStore;
  private readonly now: () => number;

  constructor(sessions: ClassroomSessionStore, options: Clock) {
    this.sessions = sessions;
    this.now = options.now;
  }

  createExercise(sessionId: string, exercise: Exercise): StoredExercise {
    this.sessions.requireMutableSessionView(sessionId);
    validateExercise(exercise);
    const stored: StoredExercise = {
      id: randomUUID(),
      sessionId,
      exercise: structuredClone(exercise),
      status: "ready",
      createdAt: this.now(),
      updatedAt: this.now(),
    };
    this.exercises.set(stored.id, stored);
    return structuredClone(stored);
  }

  startExercise(sessionId: string, exerciseId: string): StoredExercise {
    const stored = this.requireExercise(sessionId, exerciseId);
    if (stored.status === "closed") throw new Error("Exercise is closed");
    stored.status = "active";
    stored.updatedAt = this.now();
    return structuredClone(stored);
  }

  getActiveExercise(sessionId: string): StoredExercise | undefined {
    const active = [...this.exercises.values()]
      .filter((item) => item.sessionId === sessionId && item.status === "active")
      .sort((left, right) => right.updatedAt - left.updatedAt);
    return active[0] ? structuredClone(active[0]) : undefined;
  }

  saveWorkspace(participantId: string, payload: string, expectedVersion: number | undefined): StoredWorkspace {
    const topology = importWorkspace(payload);
    const participant = this.sessions.getParticipant(participantId);
    if (!participant) throw new Error("Participant not found");
    const exercise = this.getActiveExercise(participant.sessionId);
    if (!exercise) throw new Error("No active exercise");
    if (exercise.status === "locked" || exercise.status === "closed") throw new Error("Exercise is locked");
    this.sessions.requireMutableSessionView(participant.sessionId);

    const key = this.workspaceKey(participantId, exercise.id);
    const existing = this.workspaces.get(key);
    if (expectedVersion !== undefined && expectedVersion !== (existing?.topology.version ?? 0)) {
      throw new Error("Workspace version conflict; reconcile before saving");
    }
    const stored: StoredWorkspace = {
      id: existing?.id ?? randomUUID(),
      participantId,
      exerciseId: exercise.id,
      topology,
      updatedAt: this.now(),
    };
    this.workspaces.set(key, stored);
    this.sessions.markParticipantWorking(participantId);
    return structuredClone(stored);
  }

  submitWorkspace(participantId: string, payload: string, submissionKey: string, expectedVersion?: number): StoredSubmission {
    if (!submissionKey) throw new Error("Submission key is required");
    const existing = [...this.submissions.values()].find((item) => item.submissionKey === submissionKey);
    if (existing) return structuredClone(existing);

    const workspace = this.saveWorkspace(participantId, payload, expectedVersion);
    const exercise = this.exercises.get(workspace.exerciseId)!;
    const evaluation = evaluateExercise(exercise.exercise, workspace.topology);
    const submission: StoredSubmission = {
      id: randomUUID(),
      workspaceId: workspace.id,
      participantId,
      exerciseId: exercise.id,
      submissionKey,
      workspaceVersion: workspace.topology.version,
      evaluation,
      submittedAt: this.now(),
    };
    this.submissions.set(submission.id, submission);
    this.sessions.markParticipantSubmitted(participantId);
    return structuredClone(submission);
  }

  resultsForSession(sessionId: string): ResultProjection[] {
    this.sessions.requireMutableSessionView(sessionId);
    const exercise = this.getActiveExercise(sessionId);
    const participants = this.sessions.listParticipants(sessionId).filter((participant) => participant.status !== "removed");
    return participants.map((participant) => {
      const workspace = exercise ? this.workspaces.get(this.workspaceKey(participant.id, exercise.id)) : undefined;
      const submission = [...this.submissions.values()]
        .filter((item) => item.participantId === participant.id && item.exerciseId === exercise?.id)
        .sort((left, right) => right.submittedAt - left.submittedAt)[0];
      const status: ResultProjection["status"] = submission
        ? "submitted"
        : workspace
          ? "in_progress"
          : "not_started";
      return {
        participant_id: participant.id,
        nickname: participant.nickname,
        exercise_id: exercise?.id ?? "",
        status,
        workspace_version: workspace?.topology.version ?? null,
        submission: submission
          ? {
              score: submission.evaluation.score,
              status: submission.evaluation.status,
              feedback: submission.evaluation.feedback,
              checks: submission.evaluation.checks,
              submitted_at: submission.submittedAt,
            }
          : null,
      };
    });
  }

  workspacePreview(sessionId: string, participantId: string): Topology | undefined {
    this.sessions.requireMutableSessionView(sessionId);
    const participant = this.sessions.getParticipant(participantId);
    if (!participant || participant.sessionId !== sessionId) throw new Error("Participant not found");
    const exercise = this.getActiveExercise(sessionId);
    const workspace = exercise ? this.workspaces.get(this.workspaceKey(participantId, exercise.id)) : undefined;
    return workspace ? structuredClone(workspace.topology) : undefined;
  }

  private requireExercise(sessionId: string, exerciseId: string): StoredExercise {
    this.sessions.requireMutableSessionView(sessionId);
    const stored = this.exercises.get(exerciseId);
    if (!stored || stored.sessionId !== sessionId) throw new Error("Exercise not found");
    return stored;
  }

  private workspaceKey(participantId: string, exerciseId: string): string {
    return `${participantId}::${exerciseId}`;
  }
}

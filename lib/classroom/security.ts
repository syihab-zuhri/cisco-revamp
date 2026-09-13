import { timingSafeEqual } from "node:crypto";
import { hashValue, type ClassSession } from "./session.ts";

export type ActorRole = "host" | "participant";

type RateLimiterOptions = { maxAttempts: number; windowMs: number; now?: () => number };

export function hashToken(token: string): string {
  return hashValue(token);
}

export function authorizeRequest(session: ClassSession, presentedHash: string, role: ActorRole): boolean {
  if (role !== "host") return false;
  return safeEqual(session.hostTokenHash, presentedHash);
}

export function authorizeParticipant(expectedTokenHash: string, presentedHash: string): boolean {
  return Boolean(expectedTokenHash && presentedHash) && safeEqual(expectedTokenHash, presentedHash);
}

export class RateLimiter {
  private readonly attempts = new Map<string, number[]>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(options: RateLimiterOptions) {
    if (options.maxAttempts < 1 || options.windowMs < 1) throw new Error("Rate limiter configuration must be positive");
    this.maxAttempts = options.maxAttempts;
    this.windowMs = options.windowMs;
    this.now = options.now ?? (() => Date.now());
  }

  allow(key: string): boolean {
    const now = this.now();
    const recent = (this.attempts.get(key) ?? []).filter((timestamp) => now - timestamp < this.windowMs);
    if (recent.length >= this.maxAttempts) {
      this.attempts.set(key, recent);
      return false;
    }
    recent.push(now);
    this.attempts.set(key, recent);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

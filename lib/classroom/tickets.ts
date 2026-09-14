import { randomUUID } from "node:crypto";
import type { Actor } from "./api.ts";

export type RealtimeTicket = {
  ticket: string;
  sessionId: string;
  actor: Actor;
  expiresAt: number;
  consumed: boolean;
};

const TICKET_TTL_MS = 10_000;

export class TicketStore {
 private readonly tickets = new Map<string, RealtimeTicket>();

 diagnostics() {
 return { outstandingTickets: this.tickets.size };
 }
  private readonly now: () => number;
  private readonly ttlMs: number;

  constructor(options: { now?: () => number; ttlMs?: number } = {}) {
    this.now = options.now ?? (() => Date.now());
    this.ttlMs = options.ttlMs ?? TICKET_TTL_MS;
  }

  issue(sessionId: string, actor: Actor): RealtimeTicket {
    const ticket: RealtimeTicket = {
      ticket: randomUUID(),
      sessionId,
      actor,
      expiresAt: this.now() + this.ttlMs,
      consumed: false,
    };
    this.tickets.set(ticket.ticket, ticket);
    return ticket;
  }

  consume(value: string): RealtimeTicket | undefined {
    const ticket = this.tickets.get(value);
    if (!ticket) return undefined;
    if (ticket.consumed || this.now() > ticket.expiresAt) {
      this.tickets.delete(value);
      return undefined;
    }
    ticket.consumed = true;
    this.tickets.delete(value);
    return ticket;
  }
}

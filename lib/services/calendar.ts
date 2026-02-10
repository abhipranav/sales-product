import { getPrismaClient } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/services/audit";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import type { ActorIdentity } from "@/lib/auth/actor";
import { z } from "zod";

const ingestCalendarEventSchema = z.object({
  externalId: z.string().min(2).optional(),
  dealId: z.string().min(1),
  title: z.string().min(2),
  summary: z.string().min(2).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  organizerEmail: z.string().email().optional(),
  attendees: z.array(z.string().email()).default([]),
  source: z.string().min(2).default("calendar")
});

export class CalendarServiceUnavailableError extends Error {
  constructor() {
    super("Calendar service unavailable because database is not configured.");
    this.name = "CalendarServiceUnavailableError";
  }
}

export class CalendarDealNotFoundError extends Error {
  constructor(dealId: string) {
    super(`Deal not found: ${dealId}`);
    this.name = "CalendarDealNotFoundError";
  }
}

export function parseCalendarIngestInput(payload: unknown) {
  return ingestCalendarEventSchema.parse(payload);
}

export async function ingestCalendarEvent(payload: z.infer<typeof ingestCalendarEventSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new CalendarServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);

  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: payload.dealId }, { externalId: payload.dealId }],
      ...(workspaceScope?.workspaceId
        ? {
            account: {
              workspaceId: workspaceScope.workspaceId
            }
          }
        : {})
    },
    select: {
      id: true,
      externalId: true
    }
  });

  if (!deal) {
    throw new CalendarDealNotFoundError(payload.dealId);
  }

  const startsAt = new Date(payload.startsAt);
  const endsAt = new Date(payload.endsAt);

  const calendarEvent = payload.externalId
    ? await prisma.calendarEvent.upsert({
        where: {
          externalId: payload.externalId
        },
        create: {
          externalId: payload.externalId,
          dealId: deal.id,
          title: payload.title,
          startsAt,
          endsAt,
          organizerEmail: payload.organizerEmail,
          attendees: payload.attendees,
          source: payload.source
        },
        update: {
          dealId: deal.id,
          title: payload.title,
          startsAt,
          endsAt,
          organizerEmail: payload.organizerEmail,
          attendees: payload.attendees,
          source: payload.source
        }
      })
    : await prisma.calendarEvent.create({
        data: {
          dealId: deal.id,
          title: payload.title,
          startsAt,
          endsAt,
          organizerEmail: payload.organizerEmail,
          attendees: payload.attendees,
          source: payload.source
        }
      });

  const activity = await prisma.activity.create({
    data: {
      dealId: deal.id,
      type: "MEETING",
      happenedAt: startsAt,
      summary: payload.summary ?? `Calendar event ingested: ${payload.title}`
    }
  });

  await logAuditEvent({
    dealId: deal.id,
    entityType: "calendar-event",
    entityId: calendarEvent.externalId ?? calendarEvent.id,
    action: "calendar.ingested",
    actor: workspaceScope?.actorEmail ?? "system",
    details: `${payload.source}: ${payload.title}`
  });

  return {
    calendarEvent: {
      id: calendarEvent.externalId ?? calendarEvent.id,
      dealId: deal.externalId ?? deal.id,
      title: calendarEvent.title,
      startsAt: calendarEvent.startsAt.toISOString(),
      endsAt: calendarEvent.endsAt.toISOString(),
      attendees: calendarEvent.attendees,
      source: calendarEvent.source
    },
    activity: {
      id: activity.externalId ?? activity.id,
      dealId: deal.externalId ?? deal.id,
      type: "meeting",
      happenedAt: activity.happenedAt.toISOString(),
      summary: activity.summary
    }
  };
}

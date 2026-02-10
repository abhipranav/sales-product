import { getPrismaClient } from "@/lib/db/prisma";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import type { ActorIdentity } from "@/lib/auth/actor";
import { z } from "zod";

const hubspotSyncPayloadSchema = z.object({
  source: z.literal("hubspot").default("hubspot"),
  syncReason: z.string().min(2).max(120).default("manual-sync"),
  cursor: z.string().min(1).max(400).optional(),
  nextCursor: z.string().min(1).max(400).optional(),
  account: z.object({
    externalId: z.string().min(2),
    name: z.string().min(2),
    segment: z.enum(["startup", "mid-market", "enterprise"]).default("mid-market"),
    website: z.string().url().optional(),
    employeeBand: z.string().min(2).max(40).optional()
  }),
  contacts: z
    .array(
      z.object({
        externalId: z.string().min(2),
        fullName: z.string().min(2),
        title: z.string().min(2),
        email: z.string().email().optional(),
        linkedInUrl: z.string().url().optional(),
        role: z.enum(["champion", "approver", "blocker", "influencer"]).default("influencer")
      })
    )
    .default([]),
  deals: z
    .array(
      z.object({
        externalId: z.string().min(2),
        name: z.string().min(2),
        stage: z
          .enum(["discovery", "evaluation", "proposal", "procurement", "closed-won", "closed-lost"])
          .default("discovery"),
        amount: z.coerce.number().int().nonnegative().default(0),
        confidence: z.coerce.number().min(0).max(1).default(0.2),
        closeDate: z.coerce.date(),
        riskSummary: z.string().min(4).max(500).default("Needs qualification.")
      })
    )
    .default([])
});

const segmentMap = {
  startup: "STARTUP",
  "mid-market": "MID_MARKET",
  enterprise: "ENTERPRISE"
} as const;

const contactRoleMap = {
  champion: "CHAMPION",
  approver: "APPROVER",
  blocker: "BLOCKER",
  influencer: "INFLUENCER"
} as const;

const dealStageMap = {
  discovery: "DISCOVERY",
  evaluation: "EVALUATION",
  proposal: "PROPOSAL",
  procurement: "PROCUREMENT",
  "closed-won": "CLOSED_WON",
  "closed-lost": "CLOSED_LOST"
} as const;

export class HubspotSyncServiceUnavailableError extends Error {
  constructor() {
    super("CRM sync unavailable because database is not configured.");
    this.name = "HubspotSyncServiceUnavailableError";
  }
}

export class HubspotSyncWorkspaceError extends Error {
  constructor() {
    super("Workspace scope unavailable. Run `npm run db:push` to apply tenancy schema.");
    this.name = "HubspotSyncWorkspaceError";
  }
}

export class HubspotExternalIdConflictError extends Error {
  constructor(entity: "account" | "contact" | "deal", externalId: string) {
    super(`External id conflict for ${entity}: ${externalId} belongs to another workspace.`);
    this.name = "HubspotExternalIdConflictError";
  }
}

export function parseHubspotSyncPayload(payload: unknown) {
  return hubspotSyncPayloadSchema.parse(payload);
}

export async function getHubspotSyncState(actor?: ActorIdentity) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new HubspotSyncServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);

  if (!workspaceScope) {
    throw new HubspotSyncWorkspaceError();
  }

  const state =
    (await prisma.integrationSyncState.findUnique({
      where: {
        workspaceId_provider: {
          workspaceId: workspaceScope.workspaceId,
          provider: "HUBSPOT"
        }
      }
    })) ??
    (await prisma.integrationSyncState.create({
      data: {
        workspaceId: workspaceScope.workspaceId,
        provider: "HUBSPOT",
        status: "idle"
      }
    }));

  return {
    provider: "hubspot" as const,
    workspace: {
      slug: workspaceScope.workspaceSlug,
      name: workspaceScope.workspaceName
    },
    cursor: state.cursor ?? null,
    status: state.status,
    lastRunAt: state.lastRunAt?.toISOString(),
    lastError: state.lastError ?? null
  };
}

export async function syncHubspotData(payload: z.infer<typeof hubspotSyncPayloadSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new HubspotSyncServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);

  if (!workspaceScope) {
    throw new HubspotSyncWorkspaceError();
  }

  const existingAccount = await prisma.account.findUnique({
    where: {
      externalId: payload.account.externalId
    },
    select: {
      id: true,
      workspaceId: true
    }
  });

  if (existingAccount && existingAccount.workspaceId !== workspaceScope.workspaceId) {
    throw new HubspotExternalIdConflictError("account", payload.account.externalId);
  }

  const account = existingAccount
    ? await prisma.account.update({
        where: {
          id: existingAccount.id
        },
        data: {
          name: payload.account.name,
          segment: segmentMap[payload.account.segment],
          website: payload.account.website ?? null,
          employeeBand: payload.account.employeeBand ?? null
        }
      })
    : await prisma.account.create({
        data: {
          workspaceId: workspaceScope.workspaceId,
          externalId: payload.account.externalId,
          name: payload.account.name,
          segment: segmentMap[payload.account.segment],
          website: payload.account.website,
          employeeBand: payload.account.employeeBand
        }
      });

  let createdContacts = 0;
  let updatedContacts = 0;
  let createdDeals = 0;
  let updatedDeals = 0;
  const syncedDealIds: string[] = [];

  for (const contact of payload.contacts) {
    const existingContact = await prisma.contact.findUnique({
      where: {
        externalId: contact.externalId
      },
      include: {
        account: {
          select: {
            workspaceId: true
          }
        }
      }
    });

    if (existingContact && existingContact.account.workspaceId !== workspaceScope.workspaceId) {
      throw new HubspotExternalIdConflictError("contact", contact.externalId);
    }

    if (existingContact) {
      await prisma.contact.update({
        where: {
          id: existingContact.id
        },
        data: {
          accountId: account.id,
          fullName: contact.fullName,
          title: contact.title,
          email: contact.email ?? null,
          linkedIn: contact.linkedInUrl ?? null,
          role: contactRoleMap[contact.role]
        }
      });
      updatedContacts += 1;
    } else {
      await prisma.contact.create({
        data: {
          externalId: contact.externalId,
          accountId: account.id,
          fullName: contact.fullName,
          title: contact.title,
          email: contact.email,
          linkedIn: contact.linkedInUrl,
          role: contactRoleMap[contact.role]
        }
      });
      createdContacts += 1;
    }
  }

  for (const deal of payload.deals) {
    const existingDeal = await prisma.deal.findUnique({
      where: {
        externalId: deal.externalId
      },
      include: {
        account: {
          select: {
            workspaceId: true
          }
        }
      }
    });

    if (existingDeal && existingDeal.account.workspaceId !== workspaceScope.workspaceId) {
      throw new HubspotExternalIdConflictError("deal", deal.externalId);
    }

    if (existingDeal) {
      const updated = await prisma.deal.update({
        where: {
          id: existingDeal.id
        },
        data: {
          accountId: account.id,
          name: deal.name,
          stage: dealStageMap[deal.stage],
          amount: deal.amount,
          confidence: deal.confidence,
          closeDate: deal.closeDate,
          riskSummary: deal.riskSummary
        },
        select: {
          id: true
        }
      });
      syncedDealIds.push(updated.id);
      updatedDeals += 1;
    } else {
      const created = await prisma.deal.create({
        data: {
          externalId: deal.externalId,
          accountId: account.id,
          name: deal.name,
          stage: dealStageMap[deal.stage],
          amount: deal.amount,
          confidence: deal.confidence,
          closeDate: deal.closeDate,
          riskSummary: deal.riskSummary
        },
        select: {
          id: true
        }
      });
      syncedDealIds.push(created.id);
      createdDeals += 1;
    }
  }

  if (syncedDealIds.length > 0) {
    await prisma.auditLog.createMany({
      data: syncedDealIds.map((dealId) => ({
        dealId,
        entityType: "activity",
        entityId: payload.account.externalId,
        action: "crm.sync.hubspot",
        actor: workspaceScope.actorEmail,
        details: `HubSpot sync completed (${payload.syncReason}) for account ${payload.account.name}.`
      }))
    });
  }

  const nextCursor = payload.nextCursor ?? payload.cursor ?? null;
  const syncState = await prisma.integrationSyncState.upsert({
    where: {
      workspaceId_provider: {
        workspaceId: workspaceScope.workspaceId,
        provider: "HUBSPOT"
      }
    },
    create: {
      workspaceId: workspaceScope.workspaceId,
      provider: "HUBSPOT",
      cursor: nextCursor,
      status: "ok",
      lastRunAt: new Date()
    },
    update: {
      cursor: nextCursor,
      status: "ok",
      lastRunAt: new Date(),
      lastError: null
    }
  });

  return {
    workspace: {
      slug: workspaceScope.workspaceSlug,
      name: workspaceScope.workspaceName
    },
    account: {
      id: account.externalId ?? account.id,
      name: account.name
    },
    summary: {
      contacts: {
        created: createdContacts,
        updated: updatedContacts
      },
      deals: {
        created: createdDeals,
        updated: updatedDeals
      }
    },
    sync: {
      cursor: syncState.cursor ?? null,
      status: syncState.status,
      lastRunAt: syncState.lastRunAt?.toISOString()
    }
  };
}

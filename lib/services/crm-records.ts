import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import type { ActorIdentity } from "@/lib/auth/actor";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import { getDashboardSnapshot } from "@/lib/mock/dashboard";

const accountSegmentMap = {
  startup: "STARTUP",
  "mid-market": "MID_MARKET",
  enterprise: "ENTERPRISE"
} as const;

const reverseAccountSegmentMap = {
  STARTUP: "startup",
  MID_MARKET: "mid-market",
  ENTERPRISE: "enterprise"
} as const;

const dealStageMap = {
  discovery: "DISCOVERY",
  evaluation: "EVALUATION",
  proposal: "PROPOSAL",
  procurement: "PROCUREMENT",
  "closed-won": "CLOSED_WON",
  "closed-lost": "CLOSED_LOST"
} as const;

const reverseDealStageMap = {
  DISCOVERY: "discovery",
  EVALUATION: "evaluation",
  PROPOSAL: "proposal",
  PROCUREMENT: "procurement",
  CLOSED_WON: "closed-won",
  CLOSED_LOST: "closed-lost"
} as const;

const contactRoleMap = {
  champion: "CHAMPION",
  approver: "APPROVER",
  blocker: "BLOCKER",
  influencer: "INFLUENCER"
} as const;

const reverseContactRoleMap = {
  CHAMPION: "champion",
  APPROVER: "approver",
  BLOCKER: "blocker",
  INFLUENCER: "influencer"
} as const;

const createAccountSchema = z.object({
  name: z.string().min(2).max(120),
  segment: z.enum(["startup", "mid-market", "enterprise"]).default("mid-market"),
  website: z.string().url().optional(),
  employeeBand: z.string().min(2).max(40).optional()
});

const updateAccountSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    segment: z.enum(["startup", "mid-market", "enterprise"]).optional(),
    website: z.string().url().optional(),
    employeeBand: z.string().min(2).max(40).optional()
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided." });

const createContactSchema = z.object({
  accountId: z.string().min(1),
  fullName: z.string().min(2).max(120),
  title: z.string().min(2).max(120),
  email: z.string().email().optional(),
  linkedInUrl: z.string().url().optional(),
  role: z.enum(["champion", "approver", "blocker", "influencer"]).default("influencer")
});

const updateContactSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    title: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    linkedInUrl: z.string().url().optional(),
    role: z.enum(["champion", "approver", "blocker", "influencer"]).optional()
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided." });

const createDealSchema = z.object({
  accountId: z.string().min(1),
  name: z.string().min(2).max(160),
  stage: z.enum(["discovery", "evaluation", "proposal", "procurement", "closed-won", "closed-lost"]).default("discovery"),
  amount: z.coerce.number().int().min(0),
  confidence: z.coerce.number().min(0).max(1),
  closeDate: z.string().datetime(),
  riskSummary: z.string().min(5).max(500)
});

const updateDealSchema = z
  .object({
    name: z.string().min(2).max(160).optional(),
    stage: z.enum(["discovery", "evaluation", "proposal", "procurement", "closed-won", "closed-lost"]).optional(),
    amount: z.coerce.number().int().min(0).optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
    closeDate: z.string().datetime().optional(),
    riskSummary: z.string().min(5).max(500).optional()
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field must be provided." });

// Pagination types
export interface PaginationInput {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Filter types
export interface AccountFilters {
  segment?: "startup" | "mid-market" | "enterprise";
  search?: string;
}

export interface ContactFilters {
  accountId?: string;
  role?: "champion" | "approver" | "blocker" | "influencer";
  search?: string;
}

export interface DealFilters {
  accountId?: string;
  stage?: "discovery" | "evaluation" | "proposal" | "procurement" | "closed-won" | "closed-lost";
  stages?: Array<"discovery" | "evaluation" | "proposal" | "procurement" | "closed-won" | "closed-lost">;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Sort types
export type SortOrder = "asc" | "desc";
export interface SortInput {
  field: string;
  order: SortOrder;
}

export class CrmServiceUnavailableError extends Error {
  constructor() {
    super("CRM service unavailable because database is not configured.");
    this.name = "CrmServiceUnavailableError";
  }
}

export class CrmRecordNotFoundError extends Error {
  constructor(entity: "account" | "contact" | "deal", id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "CrmRecordNotFoundError";
  }
}

export function parseCreateAccountInput(payload: unknown) {
  return createAccountSchema.parse(payload);
}

export function parseUpdateAccountInput(payload: unknown) {
  return updateAccountSchema.parse(payload);
}

export function parseCreateContactInput(payload: unknown) {
  return createContactSchema.parse(payload);
}

export function parseUpdateContactInput(payload: unknown) {
  return updateContactSchema.parse(payload);
}

export function parseCreateDealInput(payload: unknown) {
  return createDealSchema.parse(payload);
}

export function parseUpdateDealInput(payload: unknown) {
  return updateDealSchema.parse(payload);
}

type AccountListItem = {
  id: string;
  name: string;
  segment: "startup" | "mid-market" | "enterprise";
  website: string | null;
  employeeBand: string | null;
  contactCount: number;
  dealCount: number;
  createdAt: Date;
};

type ContactListItem = {
  id: string;
  fullName: string;
  title: string;
  email: string | null;
  linkedIn: string | null;
  role: "champion" | "approver" | "blocker" | "influencer";
  accountId: string;
  accountName: string;
  createdAt: Date;
};

type DealListItem = {
  id: string;
  name: string;
  stage: "discovery" | "evaluation" | "proposal" | "procurement" | "closed-won" | "closed-lost";
  amount: number;
  confidence: number;
  closeDate: Date;
  riskSummary: string;
  accountId: string;
  accountName: string;
  taskCount: number;
  activityCount: number;
  createdAt: Date;
};

type MockSnapshot = ReturnType<typeof getDashboardSnapshot>;

const mockCreatedAt = new Date("2026-02-01T00:00:00.000Z");

function getMockSnapshot(): MockSnapshot {
  return getDashboardSnapshot();
}

function sortItems<T extends Record<string, unknown>>(items: T[], sort: SortInput): T[] {
  const direction = sort.order === "asc" ? 1 : -1;
  const field = sort.field;

  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    if (aValue instanceof Date && bValue instanceof Date) {
      return (aValue.getTime() - bValue.getTime()) * direction;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * direction;
    }

    return String(aValue ?? "").localeCompare(String(bValue ?? "")) * direction;
  });
}

function paginateItems<T extends { id: string }>(
  items: T[],
  pagination: PaginationInput
): PaginatedResult<T> {
  const limit = Math.min(pagination.limit ?? 20, 100);
  const offset = pagination.offset ?? 0;
  const sliced = items.slice(offset, offset + limit + 1);
  const hasMore = sliced.length > limit;
  const pageItems = sliced.slice(0, limit);

  return {
    items: pageItems,
    total: items.length,
    hasMore,
    nextCursor: hasMore ? pageItems[pageItems.length - 1]?.id : undefined
  };
}

function buildMockAccountList(snapshot: MockSnapshot): AccountListItem[] {
  return [
    {
      id: snapshot.account.id,
      name: snapshot.account.name,
      segment: snapshot.account.segment,
      website: snapshot.account.website ?? null,
      employeeBand: snapshot.account.employeeBand ?? null,
      contactCount: snapshot.contacts.length,
      dealCount: 1,
      createdAt: mockCreatedAt
    }
  ];
}

function buildMockContactList(snapshot: MockSnapshot): ContactListItem[] {
  return snapshot.contacts.map((contact) => ({
    id: contact.id,
    fullName: contact.fullName,
    title: contact.title,
    email: contact.email ?? null,
    linkedIn: contact.linkedInUrl ?? null,
    role: contact.role,
    accountId: snapshot.account.id,
    accountName: snapshot.account.name,
    createdAt: mockCreatedAt
  }));
}

function buildMockDealList(snapshot: MockSnapshot): DealListItem[] {
  return [
    {
      id: snapshot.deal.id,
      name: snapshot.deal.name,
      stage: snapshot.deal.stage,
      amount: snapshot.deal.amount,
      confidence: snapshot.deal.confidence,
      closeDate: new Date(snapshot.deal.closeDate),
      riskSummary: snapshot.deal.riskSummary,
      accountId: snapshot.account.id,
      accountName: snapshot.account.name,
      taskCount: snapshot.tasks.length,
      activityCount: snapshot.recentActivities.length,
      createdAt: mockCreatedAt
    }
  ];
}

function fallbackListAccounts(
  filters: AccountFilters,
  pagination: PaginationInput,
  sort: SortInput
): PaginatedResult<AccountListItem> {
  const snapshot = getMockSnapshot();
  const search = filters.search?.toLowerCase();

  const filtered = buildMockAccountList(snapshot).filter((account) => {
    if (filters.segment && account.segment !== filters.segment) {
      return false;
    }

    if (search) {
      const matchesName = account.name.toLowerCase().includes(search);
      const matchesWebsite = account.website?.toLowerCase().includes(search) ?? false;
      if (!matchesName && !matchesWebsite) {
        return false;
      }
    }

    return true;
  });

  return paginateItems(sortItems(filtered, sort), pagination);
}

function fallbackGetAccount(accountId: string) {
  const snapshot = getMockSnapshot();
  if (accountId !== snapshot.account.id) {
    throw new CrmRecordNotFoundError("account", accountId);
  }

  return {
    id: snapshot.account.id,
    name: snapshot.account.name,
    segment: snapshot.account.segment,
    website: snapshot.account.website ?? null,
    employeeBand: snapshot.account.employeeBand ?? null,
    createdAt: mockCreatedAt,
    updatedAt: mockCreatedAt,
    contacts: snapshot.contacts.map((contact) => ({
      id: contact.id,
      fullName: contact.fullName,
      title: contact.title,
      email: contact.email ?? null,
      linkedIn: contact.linkedInUrl ?? null,
      role: contact.role
    })),
    deals: [
      {
        id: snapshot.deal.id,
        name: snapshot.deal.name,
        stage: snapshot.deal.stage,
        amount: snapshot.deal.amount,
        confidence: snapshot.deal.confidence,
        closeDate: new Date(snapshot.deal.closeDate),
        taskCount: snapshot.tasks.length,
        activityCount: snapshot.recentActivities.length
      }
    ],
    signals: snapshot.account.signals.map((signal) => ({
      id: signal.id,
      type: signal.type,
      summary: signal.summary,
      happenedAt: new Date(signal.happenedAt),
      score: signal.score
    })),
    counts: {
      contacts: snapshot.contacts.length,
      deals: 1,
      signals: snapshot.account.signals.length
    }
  };
}

function fallbackListContacts(
  filters: ContactFilters,
  pagination: PaginationInput,
  sort: SortInput
): PaginatedResult<ContactListItem> {
  const snapshot = getMockSnapshot();
  const search = filters.search?.toLowerCase();

  const filtered = buildMockContactList(snapshot).filter((contact) => {
    if (filters.accountId && filters.accountId !== contact.accountId) {
      return false;
    }

    if (filters.role && filters.role !== contact.role) {
      return false;
    }

    if (search) {
      const matchesName = contact.fullName.toLowerCase().includes(search);
      const matchesTitle = contact.title.toLowerCase().includes(search);
      const matchesEmail = contact.email?.toLowerCase().includes(search) ?? false;
      if (!matchesName && !matchesTitle && !matchesEmail) {
        return false;
      }
    }

    return true;
  });

  return paginateItems(sortItems(filtered, sort), pagination);
}

function fallbackGetContact(contactId: string) {
  const snapshot = getMockSnapshot();
  const contact = snapshot.contacts.find((entry) => entry.id === contactId);
  if (!contact) {
    throw new CrmRecordNotFoundError("contact", contactId);
  }

  return {
    id: contact.id,
    fullName: contact.fullName,
    title: contact.title,
    email: contact.email ?? null,
    linkedIn: contact.linkedInUrl ?? null,
    role: contact.role,
    createdAt: mockCreatedAt,
    updatedAt: mockCreatedAt,
    account: {
      id: snapshot.account.id,
      name: snapshot.account.name,
      segment: snapshot.account.segment
    },
    recentSequences: []
  };
}

function fallbackListDeals(
  filters: DealFilters,
  pagination: PaginationInput,
  sort: SortInput
): PaginatedResult<DealListItem> {
  const snapshot = getMockSnapshot();
  const search = filters.search?.toLowerCase();

  const filtered = buildMockDealList(snapshot).filter((deal) => {
    if (filters.accountId && filters.accountId !== deal.accountId) {
      return false;
    }

    if (filters.stage && filters.stage !== deal.stage) {
      return false;
    }

    if (filters.stages && filters.stages.length > 0 && !filters.stages.includes(deal.stage)) {
      return false;
    }

    if (filters.minAmount !== undefined && deal.amount < filters.minAmount) {
      return false;
    }

    if (filters.maxAmount !== undefined && deal.amount > filters.maxAmount) {
      return false;
    }

    if (search) {
      const matchesName = deal.name.toLowerCase().includes(search);
      const matchesRisk = deal.riskSummary.toLowerCase().includes(search);
      if (!matchesName && !matchesRisk) {
        return false;
      }
    }

    return true;
  });

  return paginateItems(sortItems(filtered, sort), pagination);
}

function fallbackGetDeal(dealId: string) {
  const snapshot = getMockSnapshot();
  if (dealId !== snapshot.deal.id) {
    throw new CrmRecordNotFoundError("deal", dealId);
  }

  return {
    id: snapshot.deal.id,
    name: snapshot.deal.name,
    stage: snapshot.deal.stage,
    amount: snapshot.deal.amount,
    confidence: snapshot.deal.confidence,
    closeDate: new Date(snapshot.deal.closeDate),
    riskSummary: snapshot.deal.riskSummary,
    createdAt: mockCreatedAt,
    updatedAt: mockCreatedAt,
    account: {
      id: snapshot.account.id,
      name: snapshot.account.name,
      segment: snapshot.account.segment
    },
    tasks: snapshot.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      owner: task.owner,
      priority: task.priority,
      status: task.status,
      dueAt: new Date(task.dueAt),
      completedAt: null
    })),
    activities: snapshot.recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      summary: activity.summary,
      happenedAt: new Date(activity.happenedAt)
    })),
    meetingBrief: {
      primaryGoal: snapshot.meetingBrief.primaryGoal,
      likelyObjections: snapshot.meetingBrief.likelyObjections,
      recommendedNarrative: snapshot.meetingBrief.recommendedNarrative,
      proofPoints: snapshot.meetingBrief.proofPoints
    },
    followUp: {
      subject: snapshot.followUpDraft.subject,
      body: snapshot.followUpDraft.body,
      ask: snapshot.followUpDraft.ask,
      ctaTimeWindow: snapshot.followUpDraft.ctaTimeWindow
    },
    counts: {
      tasks: snapshot.tasks.length,
      activities: snapshot.recentActivities.length,
      calendarEvents: 0,
      auditLogs: snapshot.auditTrail.length
    }
  };
}

function fallbackSearchCrmRecords(
  query: string,
  types: Array<"account" | "contact" | "deal">,
  limit: number
): SearchResult[] {
  const snapshot = getMockSnapshot();
  const normalized = query.toLowerCase();
  const results: SearchResult[] = [];

  if (types.includes("account")) {
    if (
      snapshot.account.name.toLowerCase().includes(normalized) ||
      (snapshot.account.website ?? "").toLowerCase().includes(normalized)
    ) {
      results.push({
        type: "account",
        id: snapshot.account.id,
        title: snapshot.account.name,
        subtitle: snapshot.account.segment,
        metadata: snapshot.account.website ? { website: snapshot.account.website } : undefined
      });
    }
  }

  if (types.includes("contact")) {
    for (const contact of snapshot.contacts) {
      if (
        contact.fullName.toLowerCase().includes(normalized) ||
        contact.title.toLowerCase().includes(normalized) ||
        (contact.email ?? "").toLowerCase().includes(normalized)
      ) {
        results.push({
          type: "contact",
          id: contact.id,
          title: contact.fullName,
          subtitle: `${contact.title} at ${snapshot.account.name}`,
          metadata: contact.email ? { email: contact.email } : undefined
        });
      }
    }
  }

  if (types.includes("deal")) {
    if (
      snapshot.deal.name.toLowerCase().includes(normalized) ||
      snapshot.deal.riskSummary.toLowerCase().includes(normalized)
    ) {
      results.push({
        type: "deal",
        id: snapshot.deal.id,
        title: snapshot.deal.name,
        subtitle: `${snapshot.account.name} · $${snapshot.deal.amount.toLocaleString()}`,
        metadata: {
          stage: snapshot.deal.stage,
          confidence: `${Math.round(snapshot.deal.confidence * 100)}%`
        }
      });
    }
  }

  results.sort((a, b) => {
    const aExact = a.title.toLowerCase().startsWith(normalized) ? 0 : 1;
    const bExact = b.title.toLowerCase().startsWith(normalized) ? 0 : 1;
    return aExact - bExact;
  });

  return results.slice(0, limit);
}

async function resolveAccount(
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>,
  accountId: string,
  workspaceId?: string
) {
  return prisma.account.findFirst({
    where: {
      OR: [{ id: accountId }, { externalId: accountId }],
      ...(workspaceId ? { workspaceId } : {})
    }
  });
}

// ============================================
// ACCOUNT OPERATIONS
// ============================================

export async function createAccount(payload: z.infer<typeof createAccountSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const workspaceId = workspaceScope?.workspaceId;
  if (!workspaceId) {
    throw new CrmServiceUnavailableError();
  }

  const account = await prisma.account.create({
    data: {
      workspaceId,
      name: payload.name,
      segment: accountSegmentMap[payload.segment],
      website: payload.website ?? null,
      employeeBand: payload.employeeBand ?? null
    }
  });

  return {
    id: account.externalId ?? account.id,
    name: account.name
  };
}

export async function updateAccount(accountId: string, payload: z.infer<typeof updateAccountSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await resolveAccount(prisma, accountId, workspaceScope?.workspaceId);
  if (!existing) {
    throw new CrmRecordNotFoundError("account", accountId);
  }

  const account = await prisma.account.update({
    where: {
      id: existing.id
    },
    data: {
      name: payload.name,
      segment: payload.segment ? accountSegmentMap[payload.segment] : undefined,
      website: payload.website === undefined ? undefined : payload.website || null,
      employeeBand: payload.employeeBand === undefined ? undefined : payload.employeeBand || null
    }
  });

  return {
    id: account.externalId ?? account.id,
    name: account.name
  };
}

export async function listAccounts(
  filters: AccountFilters = {},
  pagination: PaginationInput = {},
  sort: SortInput = { field: "name", order: "asc" },
  actor?: ActorIdentity
): Promise<PaginatedResult<{
  id: string;
  name: string;
  segment: "startup" | "mid-market" | "enterprise";
  website: string | null;
  employeeBand: string | null;
  contactCount: number;
  dealCount: number;
  createdAt: Date;
}>> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return fallbackListAccounts(filters, pagination, sort);
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const workspaceId = workspaceScope?.workspaceId;
  if (!workspaceId) {
    return fallbackListAccounts(filters, pagination, sort);
  }

  const limit = Math.min(pagination.limit ?? 20, 100);
  const offset = pagination.offset ?? 0;

  const where = {
    workspaceId,
    ...(filters.segment ? { segment: accountSegmentMap[filters.segment] } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { website: { contains: filters.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [accounts, total] = await Promise.all([
    prisma.account.findMany({
      where,
      include: {
        _count: {
          select: {
            contacts: true,
            deals: true
          }
        }
      },
      orderBy: { [sort.field]: sort.order },
      take: limit + 1,
      skip: offset
    }),
    prisma.account.count({ where })
  ]);

  const hasMore = accounts.length > limit;
  const items = accounts.slice(0, limit).map((a) => ({
    id: a.externalId ?? a.id,
    name: a.name,
    segment: reverseAccountSegmentMap[a.segment as keyof typeof reverseAccountSegmentMap],
    website: a.website,
    employeeBand: a.employeeBand,
    contactCount: a._count.contacts,
    dealCount: a._count.deals,
    createdAt: a.createdAt
  }));

  return {
    items,
    total,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id : undefined
  };
}

export async function getAccount(accountId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return fallbackGetAccount(accountId);
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    return fallbackGetAccount(accountId);
  }

  const account = await prisma.account.findFirst({
    where: {
      OR: [{ id: accountId }, { externalId: accountId }],
      workspaceId: workspaceScope.workspaceId
    },
    include: {
      contacts: {
        orderBy: { createdAt: "desc" },
        take: 10
      },
      deals: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          _count: {
            select: { tasks: true, activities: true }
          }
        }
      },
      signals: {
        orderBy: { happenedAt: "desc" },
        take: 5
      },
      _count: {
        select: {
          contacts: true,
          deals: true,
          signals: true
        }
      }
    }
  });

  if (!account) {
    const snapshot = getMockSnapshot();
    if (accountId === snapshot.account.id) {
      return fallbackGetAccount(accountId);
    }

    throw new CrmRecordNotFoundError("account", accountId);
  }

  return {
    id: account.externalId ?? account.id,
    name: account.name,
    segment: reverseAccountSegmentMap[account.segment as keyof typeof reverseAccountSegmentMap],
    website: account.website,
    employeeBand: account.employeeBand,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    contacts: account.contacts.map((c) => ({
      id: c.externalId ?? c.id,
      fullName: c.fullName,
      title: c.title,
      email: c.email,
      linkedIn: c.linkedIn,
      role: reverseContactRoleMap[c.role as keyof typeof reverseContactRoleMap]
    })),
    deals: account.deals.map((d) => ({
      id: d.externalId ?? d.id,
      name: d.name,
      stage: reverseDealStageMap[d.stage as keyof typeof reverseDealStageMap],
      amount: d.amount,
      confidence: d.confidence,
      closeDate: d.closeDate,
      taskCount: d._count.tasks,
      activityCount: d._count.activities
    })),
    signals: account.signals.map((s) => ({
      id: s.externalId ?? s.id,
      type: s.type.toLowerCase(),
      summary: s.summary,
      happenedAt: s.happenedAt,
      score: s.score
    })),
    counts: account._count
  };
}

export async function deleteAccount(accountId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await resolveAccount(prisma, accountId, workspaceScope?.workspaceId);
  if (!existing) {
    throw new CrmRecordNotFoundError("account", accountId);
  }

  await prisma.account.delete({
    where: { id: existing.id }
  });

  return { success: true, deletedId: accountId };
}

// ============================================
// CONTACT OPERATIONS
// ============================================

export async function createContact(payload: z.infer<typeof createContactSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const account = await resolveAccount(prisma, payload.accountId, workspaceScope?.workspaceId);
  if (!account) {
    throw new CrmRecordNotFoundError("account", payload.accountId);
  }

  const contact = await prisma.contact.create({
    data: {
      accountId: account.id,
      fullName: payload.fullName,
      title: payload.title,
      email: payload.email ?? null,
      linkedIn: payload.linkedInUrl ?? null,
      role: contactRoleMap[payload.role]
    }
  });

  return {
    id: contact.externalId ?? contact.id,
    fullName: contact.fullName
  };
}

export async function updateContact(contactId: string, payload: z.infer<typeof updateContactSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await prisma.contact.findFirst({
    where: {
      OR: [{ id: contactId }, { externalId: contactId }],
      ...(workspaceScope?.workspaceId
        ? {
            account: {
              workspaceId: workspaceScope.workspaceId
            }
          }
        : {})
    }
  });

  if (!existing) {
    throw new CrmRecordNotFoundError("contact", contactId);
  }

  const contact = await prisma.contact.update({
    where: {
      id: existing.id
    },
    data: {
      fullName: payload.fullName,
      title: payload.title,
      email: payload.email === undefined ? undefined : payload.email || null,
      linkedIn: payload.linkedInUrl === undefined ? undefined : payload.linkedInUrl || null,
      role: payload.role ? contactRoleMap[payload.role] : undefined
    }
  });

  return {
    id: contact.externalId ?? contact.id,
    fullName: contact.fullName
  };
}

export async function listContacts(
  filters: ContactFilters = {},
  pagination: PaginationInput = {},
  sort: SortInput = { field: "fullName", order: "asc" },
  actor?: ActorIdentity
): Promise<PaginatedResult<{
  id: string;
  fullName: string;
  title: string;
  email: string | null;
  linkedIn: string | null;
  role: "champion" | "approver" | "blocker" | "influencer";
  accountId: string;
  accountName: string;
  createdAt: Date;
}>> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return fallbackListContacts(filters, pagination, sort);
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const workspaceId = workspaceScope?.workspaceId;
  if (!workspaceId) {
    return fallbackListContacts(filters, pagination, sort);
  }

  const limit = Math.min(pagination.limit ?? 20, 100);
  const offset = pagination.offset ?? 0;

  // Resolve accountId if provided
  let resolvedAccountId: string | undefined;
  if (filters.accountId) {
    const account = await resolveAccount(prisma, filters.accountId, workspaceId);
    resolvedAccountId = account?.id;
  }

  const where = {
    account: { workspaceId },
    ...(resolvedAccountId ? { accountId: resolvedAccountId } : {}),
    ...(filters.role ? { role: contactRoleMap[filters.role] } : {}),
    ...(filters.search
      ? {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" as const } },
            { title: { contains: filters.search, mode: "insensitive" as const } },
            { email: { contains: filters.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      include: {
        account: {
          select: { id: true, externalId: true, name: true }
        }
      },
      orderBy: { [sort.field]: sort.order },
      take: limit + 1,
      skip: offset
    }),
    prisma.contact.count({ where })
  ]);

  const hasMore = contacts.length > limit;
  const items = contacts.slice(0, limit).map((c) => ({
    id: c.externalId ?? c.id,
    fullName: c.fullName,
    title: c.title,
    email: c.email,
    linkedIn: c.linkedIn,
    role: reverseContactRoleMap[c.role as keyof typeof reverseContactRoleMap],
    accountId: c.account.externalId ?? c.account.id,
    accountName: c.account.name,
    createdAt: c.createdAt
  }));

  return {
    items,
    total,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id : undefined
  };
}

export async function getContact(contactId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return fallbackGetContact(contactId);
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    return fallbackGetContact(contactId);
  }

  const contact = await prisma.contact.findFirst({
    where: {
      OR: [{ id: contactId }, { externalId: contactId }],
      account: { workspaceId: workspaceScope.workspaceId }
    },
    include: {
      account: {
        select: { id: true, externalId: true, name: true, segment: true }
      },
      sequenceExecutions: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  });

  if (!contact) {
    const snapshot = getMockSnapshot();
    if (snapshot.contacts.some((entry) => entry.id === contactId)) {
      return fallbackGetContact(contactId);
    }

    throw new CrmRecordNotFoundError("contact", contactId);
  }

  return {
    id: contact.externalId ?? contact.id,
    fullName: contact.fullName,
    title: contact.title,
    email: contact.email,
    linkedIn: contact.linkedIn,
    role: reverseContactRoleMap[contact.role as keyof typeof reverseContactRoleMap],
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    account: {
      id: contact.account.externalId ?? contact.account.id,
      name: contact.account.name,
      segment: reverseAccountSegmentMap[contact.account.segment as keyof typeof reverseAccountSegmentMap]
    },
    recentSequences: contact.sequenceExecutions.map((se) => ({
      id: se.id,
      title: se.title,
      status: se.status.toLowerCase(),
      createdAt: se.createdAt
    }))
  };
}

export async function deleteContact(contactId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await prisma.contact.findFirst({
    where: {
      OR: [{ id: contactId }, { externalId: contactId }],
      ...(workspaceScope?.workspaceId
        ? { account: { workspaceId: workspaceScope.workspaceId } }
        : {})
    }
  });

  if (!existing) {
    throw new CrmRecordNotFoundError("contact", contactId);
  }

  await prisma.contact.delete({
    where: { id: existing.id }
  });

  return { success: true, deletedId: contactId };
}

// ============================================
// DEAL OPERATIONS
// ============================================

export async function createDeal(payload: z.infer<typeof createDealSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const account = await resolveAccount(prisma, payload.accountId, workspaceScope?.workspaceId);
  if (!account) {
    throw new CrmRecordNotFoundError("account", payload.accountId);
  }

  const deal = await prisma.deal.create({
    data: {
      accountId: account.id,
      name: payload.name,
      stage: dealStageMap[payload.stage],
      amount: payload.amount,
      confidence: payload.confidence,
      closeDate: new Date(payload.closeDate),
      riskSummary: payload.riskSummary
    }
  });

  return {
    id: deal.externalId ?? deal.id,
    name: deal.name
  };
}

export async function updateDeal(dealId: string, payload: z.infer<typeof updateDealSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await prisma.deal.findFirst({
    where: {
      OR: [{ id: dealId }, { externalId: dealId }],
      ...(workspaceScope?.workspaceId
        ? {
            account: {
              workspaceId: workspaceScope.workspaceId
            }
          }
        : {})
    }
  });

  if (!existing) {
    throw new CrmRecordNotFoundError("deal", dealId);
  }

  const deal = await prisma.deal.update({
    where: {
      id: existing.id
    },
    data: {
      name: payload.name,
      stage: payload.stage ? dealStageMap[payload.stage] : undefined,
      amount: payload.amount,
      confidence: payload.confidence,
      closeDate: payload.closeDate ? new Date(payload.closeDate) : undefined,
      riskSummary: payload.riskSummary
    }
  });

  return {
    id: deal.externalId ?? deal.id,
    name: deal.name
  };
}

export async function listDeals(
  filters: DealFilters = {},
  pagination: PaginationInput = {},
  sort: SortInput = { field: "createdAt", order: "desc" },
  actor?: ActorIdentity
): Promise<PaginatedResult<{
  id: string;
  name: string;
  stage: "discovery" | "evaluation" | "proposal" | "procurement" | "closed-won" | "closed-lost";
  amount: number;
  confidence: number;
  closeDate: Date;
  riskSummary: string;
  accountId: string;
  accountName: string;
  taskCount: number;
  activityCount: number;
  createdAt: Date;
}>> {
  const prisma = getPrismaClient();
  if (!prisma) {
    return fallbackListDeals(filters, pagination, sort);
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const workspaceId = workspaceScope?.workspaceId;
  if (!workspaceId) {
    return fallbackListDeals(filters, pagination, sort);
  }

  const limit = Math.min(pagination.limit ?? 20, 100);
  const offset = pagination.offset ?? 0;

  // Resolve accountId if provided
  let resolvedAccountId: string | undefined;
  if (filters.accountId) {
    const account = await resolveAccount(prisma, filters.accountId, workspaceId);
    resolvedAccountId = account?.id;
  }

  // Build stage filter
  let stageFilter: object | undefined;
  if (filters.stages && filters.stages.length > 0) {
    stageFilter = { stage: { in: filters.stages.map((s) => dealStageMap[s]) } };
  } else if (filters.stage) {
    stageFilter = { stage: dealStageMap[filters.stage] };
  }

  const where = {
    account: { workspaceId },
    ...(resolvedAccountId ? { accountId: resolvedAccountId } : {}),
    ...stageFilter,
    ...(filters.minAmount !== undefined ? { amount: { gte: filters.minAmount } } : {}),
    ...(filters.maxAmount !== undefined ? { amount: { lte: filters.maxAmount } } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" as const } },
            { riskSummary: { contains: filters.search, mode: "insensitive" as const } }
          ]
        }
      : {})
  };

  const [deals, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        account: {
          select: { id: true, externalId: true, name: true }
        },
        _count: {
          select: { tasks: true, activities: true }
        }
      },
      orderBy: { [sort.field]: sort.order },
      take: limit + 1,
      skip: offset
    }),
    prisma.deal.count({ where })
  ]);

  const hasMore = deals.length > limit;
  const items = deals.slice(0, limit).map((d) => ({
    id: d.externalId ?? d.id,
    name: d.name,
    stage: reverseDealStageMap[d.stage as keyof typeof reverseDealStageMap],
    amount: d.amount,
    confidence: d.confidence,
    closeDate: d.closeDate,
    riskSummary: d.riskSummary,
    accountId: d.account.externalId ?? d.account.id,
    accountName: d.account.name,
    taskCount: d._count.tasks,
    activityCount: d._count.activities,
    createdAt: d.createdAt
  }));

  return {
    items,
    total,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1]?.id : undefined
  };
}

export async function getDeal(dealId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return fallbackGetDeal(dealId);
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    return fallbackGetDeal(dealId);
  }

  const deal = await prisma.deal.findFirst({
    where: {
      OR: [{ id: dealId }, { externalId: dealId }],
      account: { workspaceId: workspaceScope.workspaceId }
    },
    include: {
      account: {
        select: { id: true, externalId: true, name: true, segment: true }
      },
      tasks: {
        orderBy: { dueAt: "asc" },
        take: 10
      },
      activities: {
        orderBy: { happenedAt: "desc" },
        take: 10
      },
      meetingBrief: true,
      followUp: true,
      _count: {
        select: { tasks: true, activities: true, calendarEvents: true, auditLogs: true }
      }
    }
  });

  if (!deal) {
    const snapshot = getMockSnapshot();
    if (dealId === snapshot.deal.id) {
      return fallbackGetDeal(dealId);
    }

    throw new CrmRecordNotFoundError("deal", dealId);
  }

  return {
    id: deal.externalId ?? deal.id,
    name: deal.name,
    stage: reverseDealStageMap[deal.stage as keyof typeof reverseDealStageMap],
    amount: deal.amount,
    confidence: deal.confidence,
    closeDate: deal.closeDate,
    riskSummary: deal.riskSummary,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    account: {
      id: deal.account.externalId ?? deal.account.id,
      name: deal.account.name,
      segment: reverseAccountSegmentMap[deal.account.segment as keyof typeof reverseAccountSegmentMap]
    },
    tasks: deal.tasks.map((t) => ({
      id: t.externalId ?? t.id,
      title: t.title,
      owner: t.owner.toLowerCase(),
      priority: t.priority.toLowerCase(),
      status: t.status.toLowerCase(),
      dueAt: t.dueAt,
      completedAt: t.completedAt
    })),
    activities: deal.activities.map((a) => ({
      id: a.externalId ?? a.id,
      type: a.type.toLowerCase(),
      summary: a.summary,
      happenedAt: a.happenedAt
    })),
    meetingBrief: deal.meetingBrief
      ? {
          primaryGoal: deal.meetingBrief.primaryGoal,
          likelyObjections: deal.meetingBrief.likelyObjections,
          recommendedNarrative: deal.meetingBrief.recommendedNarrative,
          proofPoints: deal.meetingBrief.proofPoints
        }
      : null,
    followUp: deal.followUp
      ? {
          subject: deal.followUp.subject,
          body: deal.followUp.body,
          ask: deal.followUp.ask,
          ctaTimeWindow: deal.followUp.ctaTimeWindow
        }
      : null,
    counts: deal._count
  };
}

export async function deleteDeal(dealId: string, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await prisma.deal.findFirst({
    where: {
      OR: [{ id: dealId }, { externalId: dealId }],
      ...(workspaceScope?.workspaceId
        ? { account: { workspaceId: workspaceScope.workspaceId } }
        : {})
    }
  });

  if (!existing) {
    throw new CrmRecordNotFoundError("deal", dealId);
  }

  await prisma.deal.delete({
    where: { id: existing.id }
  });

  return { success: true, deletedId: dealId };
}

export async function updateDealStage(
  dealId: string,
  stage: "discovery" | "evaluation" | "proposal" | "procurement" | "closed-won" | "closed-lost",
  actor?: ActorIdentity
) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new CrmServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const existing = await prisma.deal.findFirst({
    where: {
      OR: [{ id: dealId }, { externalId: dealId }],
      ...(workspaceScope?.workspaceId
        ? { account: { workspaceId: workspaceScope.workspaceId } }
        : {})
    }
  });

  if (!existing) {
    throw new CrmRecordNotFoundError("deal", dealId);
  }

  const previousStage = existing.stage;
  const deal = await prisma.deal.update({
    where: { id: existing.id },
    data: { stage: dealStageMap[stage] }
  });

  return {
    id: deal.externalId ?? deal.id,
    name: deal.name,
    previousStage: reverseDealStageMap[previousStage as keyof typeof reverseDealStageMap],
    newStage: stage
  };
}

// ============================================
// GLOBAL SEARCH
// ============================================

export interface SearchResult {
  type: "account" | "contact" | "deal";
  id: string;
  title: string;
  subtitle: string;
  metadata?: Record<string, string>;
}

export async function searchCrmRecords(
  query: string,
  types: Array<"account" | "contact" | "deal"> = ["account", "contact", "deal"],
  limit: number = 10,
  actor?: ActorIdentity
): Promise<SearchResult[]> {
  const normalizedQuery = query.trim();
  const prisma = getPrismaClient();
  if (!prisma) {
    return fallbackSearchCrmRecords(normalizedQuery, types, limit);
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  const workspaceId = workspaceScope?.workspaceId;
  if (!workspaceId) {
    return fallbackSearchCrmRecords(normalizedQuery, types, limit);
  }

  const perTypeLimit = Math.ceil(limit / types.length);
  const lookups: Array<Promise<SearchResult[]>> = [];

  if (types.includes("account")) {
    lookups.push(
      prisma.account
        .findMany({
          where: {
            workspaceId,
            OR: [
              { name: { contains: normalizedQuery, mode: "insensitive" } },
              { website: { contains: normalizedQuery, mode: "insensitive" } }
            ]
          },
          take: perTypeLimit,
          orderBy: { name: "asc" }
        })
        .then((accounts) =>
          accounts.map((account) => ({
            type: "account" as const,
            id: account.externalId ?? account.id,
            title: account.name,
            subtitle: reverseAccountSegmentMap[account.segment as keyof typeof reverseAccountSegmentMap],
            metadata: account.website ? { website: account.website } : undefined
          }))
        )
    );
  }

  if (types.includes("contact")) {
    lookups.push(
      prisma.contact
        .findMany({
          where: {
            account: { workspaceId },
            OR: [
              { fullName: { contains: normalizedQuery, mode: "insensitive" } },
              { title: { contains: normalizedQuery, mode: "insensitive" } },
              { email: { contains: normalizedQuery, mode: "insensitive" } }
            ]
          },
          include: { account: { select: { name: true } } },
          take: perTypeLimit,
          orderBy: { fullName: "asc" }
        })
        .then((contacts) =>
          contacts.map((contact) => ({
            type: "contact" as const,
            id: contact.externalId ?? contact.id,
            title: contact.fullName,
            subtitle: `${contact.title} at ${contact.account.name}`,
            metadata: contact.email ? { email: contact.email } : undefined
          }))
        )
    );
  }

  if (types.includes("deal")) {
    lookups.push(
      prisma.deal
        .findMany({
          where: {
            account: { workspaceId },
            OR: [
              { name: { contains: normalizedQuery, mode: "insensitive" } },
              { riskSummary: { contains: normalizedQuery, mode: "insensitive" } }
            ]
          },
          include: { account: { select: { name: true } } },
          take: perTypeLimit,
          orderBy: { createdAt: "desc" }
        })
        .then((deals) =>
          deals.map((deal) => ({
            type: "deal" as const,
            id: deal.externalId ?? deal.id,
            title: deal.name,
            subtitle: `${deal.account.name} · $${deal.amount.toLocaleString()}`,
            metadata: {
              stage: reverseDealStageMap[deal.stage as keyof typeof reverseDealStageMap],
              confidence: `${Math.round(deal.confidence * 100)}%`
            }
          }))
        )
    );
  }

  const results = (await Promise.all(lookups)).flat();

  // Sort results by relevance (exact match first)
  results.sort((a, b) => {
    const lowerQuery = normalizedQuery.toLowerCase();
    const aExact = a.title.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
    const bExact = b.title.toLowerCase().startsWith(lowerQuery) ? 0 : 1;
    return aExact - bExact;
  });

  return results.slice(0, limit);
}

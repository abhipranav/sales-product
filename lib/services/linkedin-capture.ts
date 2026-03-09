import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { ActorIdentity } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { deriveLinkedInCaptureHints } from "@/lib/integrations/linkedin-companion";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

const log = logger.child({ module: "services/linkedin-capture" });

const accountSegmentMap = {
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

const linkedInCaptureSchema = z
  .object({
    sourceUrl: z.string().trim().url().optional(),
    sourceTitle: z.string().trim().max(200).optional(),
    accountId: z.string().trim().min(1).optional(),
    companyName: z.string().trim().min(2).max(120).optional(),
    companyWebsite: z.string().trim().url().optional(),
    employeeBand: z.string().trim().min(2).max(40).optional(),
    segment: z.enum(["startup", "mid-market", "enterprise"]).default("mid-market"),
    contactName: z.string().trim().min(2).max(120).optional(),
    contactTitle: z.string().trim().min(2).max(120).optional(),
    contactEmail: z.string().trim().email().optional(),
    contactLinkedInUrl: z.string().trim().url().optional(),
    contactRole: z.enum(["champion", "approver", "blocker", "influencer"]).default("influencer")
  })
  .superRefine((value, ctx) => {
    const hints = deriveLinkedInCaptureHints(value.sourceUrl, value.sourceTitle);

    if (!value.accountId && !value.companyName && !hints.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide an existing account or a company name.",
        path: ["companyName"]
      });
    }

    if ((value.contactName || hints.contactName) && !(value.contactTitle || hints.contactTitle)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Contact title is required when saving a contact.",
        path: ["contactTitle"]
      });
    }
  });

type CaptureStatus = "created" | "updated" | "matched";

export class LinkedInCaptureServiceUnavailableError extends Error {
  constructor() {
    super("LinkedIn capture is unavailable because the database is not configured.");
    this.name = "LinkedInCaptureServiceUnavailableError";
  }
}

function normalizeWebsiteHost(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    return parsed.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "").toLowerCase();
  }
}

function normalizeLinkedInUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin.toLowerCase()}${normalizedPath}`;
  } catch {
    return value.trim().replace(/\/+$/, "");
  }
}

async function findAccountMatch(
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>,
  workspaceId: string,
  payload: z.infer<typeof linkedInCaptureSchema>
) {
  if (payload.accountId) {
    return prisma.account.findFirst({
      where: {
        workspaceId,
        OR: [{ id: payload.accountId }, { externalId: payload.accountId }]
      }
    });
  }

  const websiteHost = normalizeWebsiteHost(payload.companyWebsite);
  if (websiteHost) {
    const websiteCandidates = await prisma.account.findMany({
      where: {
        workspaceId,
        website: {
          not: null
        }
      }
    });

    const websiteMatch = websiteCandidates.find((candidate) => normalizeWebsiteHost(candidate.website) === websiteHost);
    if (websiteMatch) {
      return websiteMatch;
    }
  }

  if (!payload.companyName) {
    return null;
  }

  return prisma.account.findFirst({
    where: {
      workspaceId,
      name: {
        equals: payload.companyName,
        mode: "insensitive"
      }
    }
  });
}

async function findContactMatch(
  prisma: NonNullable<ReturnType<typeof getPrismaClient>>,
  accountId: string,
  payload: z.infer<typeof linkedInCaptureSchema>
) {
  if (payload.contactEmail) {
    const byEmail = await prisma.contact.findFirst({
      where: {
        accountId,
        email: {
          equals: payload.contactEmail,
          mode: "insensitive"
        }
      }
    });

    if (byEmail) {
      return byEmail;
    }
  }

  const normalizedLinkedIn = normalizeLinkedInUrl(payload.contactLinkedInUrl);
  if (normalizedLinkedIn) {
    const byLinkedIn = await prisma.contact.findFirst({
      where: {
        accountId,
        linkedIn: {
          equals: normalizedLinkedIn,
          mode: "insensitive"
        }
      }
    });

    if (byLinkedIn) {
      return byLinkedIn;
    }
  }

  if (!payload.contactName) {
    return null;
  }

  return prisma.contact.findFirst({
    where: {
      accountId,
      fullName: {
        equals: payload.contactName,
        mode: "insensitive"
      }
    }
  });
}

export function parseLinkedInCaptureInput(payload: unknown) {
  return linkedInCaptureSchema.parse(payload);
}

export async function captureLinkedInLead(payload: z.infer<typeof linkedInCaptureSchema>, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new LinkedInCaptureServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    throw new LinkedInCaptureServiceUnavailableError();
  }

  const hints = deriveLinkedInCaptureHints(payload.sourceUrl, payload.sourceTitle);
  const companyName = payload.companyName ?? hints.companyName;
  const contactLinkedInUrl = normalizeLinkedInUrl(payload.contactLinkedInUrl ?? hints.contactLinkedInUrl);
  const contactName = payload.contactName ?? hints.contactName;
  const contactTitle = payload.contactTitle ?? hints.contactTitle;

  const normalizedPayload = {
    ...payload,
    companyName,
    contactName,
    contactTitle,
    contactLinkedInUrl: contactLinkedInUrl ?? undefined
  };

  const accountMatch = await findAccountMatch(prisma, workspaceScope.workspaceId, normalizedPayload);

  let accountStatus: CaptureStatus = "matched";
  let account = accountMatch;

  if (!account) {
    account = await prisma.account.create({
      data: {
        workspaceId: workspaceScope.workspaceId,
        name: companyName!,
        segment: accountSegmentMap[payload.segment],
        website: payload.companyWebsite ?? null,
        employeeBand: payload.employeeBand ?? null
      }
    });
    accountStatus = "created";
  }

  if (accountMatch && !accountMatch.website && payload.companyWebsite) {
    await prisma.account.update({
      where: {
        id: accountMatch.id
      },
      data: {
        website: payload.companyWebsite
      }
    });
    accountStatus = "updated";
  }

  let nextContact: Prisma.ContactGetPayload<Record<string, never>> | null = null;
  let contactStatus: CaptureStatus | null = null;

  if (contactName && contactTitle) {
    const contactMatch = await findContactMatch(prisma, account.id, normalizedPayload);

    if (contactMatch) {
      const shouldUpdate =
        (!contactMatch.email && Boolean(payload.contactEmail)) ||
        (!contactMatch.linkedIn && Boolean(contactLinkedInUrl)) ||
        (contactMatch.role === "INFLUENCER" && payload.contactRole !== "influencer");

      nextContact = shouldUpdate
        ? await prisma.contact.update({
            where: {
              id: contactMatch.id
            },
            data: {
              email: contactMatch.email ?? payload.contactEmail ?? null,
              linkedIn: contactMatch.linkedIn ?? contactLinkedInUrl ?? null,
              role: contactMatch.role === "INFLUENCER" ? contactRoleMap[payload.contactRole] : contactMatch.role
            }
          })
        : contactMatch;
      contactStatus = shouldUpdate ? "updated" : "matched";
    } else {
      nextContact = await prisma.contact.create({
        data: {
          accountId: account.id,
          fullName: contactName,
          title: contactTitle,
          email: payload.contactEmail ?? null,
          linkedIn: contactLinkedInUrl ?? null,
          role: contactRoleMap[payload.contactRole]
        }
      });
      contactStatus = "created";
    }
  }

  log.info("LinkedIn companion capture saved", {
    action: "capture",
    accountId: account.id,
    contactId: nextContact?.id,
    accountStatus,
    contactStatus,
    sourceUrl: payload.sourceUrl
  });

  return {
    source: {
      url: payload.sourceUrl ?? null,
      title: payload.sourceTitle ?? null
    },
    account: {
      id: account.externalId ?? account.id,
      name: account.name,
      status: accountStatus
    },
    contact: nextContact
      ? {
          id: nextContact.externalId ?? nextContact.id,
          fullName: nextContact.fullName,
          status: contactStatus
        }
      : null
  };
}

import type { ActorIdentity } from "@/lib/auth/actor";
import { disablePrismaClient, getPrismaClient, isPrismaConnectionError } from "@/lib/db/prisma";
import type { Deal, WorkspaceContextView } from "@/lib/domain/types";
import { getDashboardSnapshot } from "@/lib/mock/dashboard";
import { resolveWorkspaceScope, WorkspaceAccessDeniedError } from "@/lib/services/workspace";

export interface WorkspaceSummaryData {
  workspace: WorkspaceContextView;
  account: {
    id: string;
    name: string;
    segment: "startup" | "mid-market" | "enterprise";
    website?: string;
    employeeBand?: string;
  };
  deal: Deal;
}

const segmentMap = {
  STARTUP: "startup",
  MID_MARKET: "mid-market",
  ENTERPRISE: "enterprise"
} as const;

const dealStageMap = {
  DISCOVERY: "discovery",
  EVALUATION: "evaluation",
  PROPOSAL: "proposal",
  PROCUREMENT: "procurement",
  CLOSED_WON: "closed-won",
  CLOSED_LOST: "closed-lost"
} as const;

function getWorkspaceSummarySnapshot(): WorkspaceSummaryData {
  const snapshot = getDashboardSnapshot();

  return {
    workspace: snapshot.workspace,
    account: {
      id: snapshot.account.id,
      name: snapshot.account.name,
      segment: snapshot.account.segment,
      website: snapshot.account.website,
      employeeBand: snapshot.account.employeeBand
    },
    deal: snapshot.deal
  };
}

export async function getWorkspaceSummary(actor?: ActorIdentity): Promise<WorkspaceSummaryData> {
  const prisma = getPrismaClient();

  if (!prisma) {
    return getWorkspaceSummarySnapshot();
  }

  try {
    const workspaceScope = await resolveWorkspaceScope(prisma, actor);

    if (!workspaceScope?.workspaceId) {
      return getWorkspaceSummarySnapshot();
    }

    const deal = await prisma.deal.findFirst({
      where: {
        account: {
          workspaceId: workspaceScope.workspaceId
        },
        stage: {
          notIn: ["CLOSED_WON", "CLOSED_LOST"]
        }
      },
      include: {
        account: {
          select: {
            id: true,
            externalId: true,
            name: true,
            segment: true,
            website: true,
            employeeBand: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    if (!deal) {
      return getWorkspaceSummarySnapshot();
    }

    return {
      workspace: {
        slug: workspaceScope.workspaceSlug,
        name: workspaceScope.workspaceName,
        actorEmail: workspaceScope.actorEmail,
        actorName: workspaceScope.actorName,
        actorRole: workspaceScope.actorRole
      },
      account: {
        id: deal.account.externalId ?? deal.account.id,
        name: deal.account.name,
        segment: segmentMap[deal.account.segment],
        website: deal.account.website ?? undefined,
        employeeBand: deal.account.employeeBand ?? undefined
      },
      deal: {
        id: deal.externalId ?? deal.id,
        accountId: deal.accountId,
        name: deal.name,
        stage: dealStageMap[deal.stage],
        amount: deal.amount,
        confidence: deal.confidence,
        closeDate: deal.closeDate.toISOString(),
        riskSummary: deal.riskSummary
      }
    };
  } catch (error) {
    if (error instanceof WorkspaceAccessDeniedError) {
      return getWorkspaceSummarySnapshot();
    }

    if (isPrismaConnectionError(error)) {
      await disablePrismaClient(
        "Database is unreachable from this network. Falling back to mock workspace summary until app restart."
      );
      return getWorkspaceSummarySnapshot();
    }

    return getWorkspaceSummarySnapshot();
  }
}

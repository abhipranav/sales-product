import { NextResponse } from "next/server";
import { getPrismaClient } from "@/lib/db/prisma";
import { getActorFromRequest } from "@/lib/auth/actor";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

export async function POST(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const prisma = getPrismaClient();
    if (!prisma) {
      return NextResponse.json(
        { error: "Database service is not configured." },
        { status: 503 }
      );
    }

    const workspaceScope = await resolveWorkspaceScope(prisma, actor);
    if (!workspaceScope?.workspaceId) {
      return NextResponse.json(
        { error: "Workspace access denied." },
        { status: 403 }
      );
    }

    // Get all accounts in the active workspace
    const accounts = await prisma.account.findMany({
      where: { workspaceId: workspaceScope.workspaceId },
    });

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: "No accounts found in workspace to simulate signals for. Please seed database first." },
        { status: 400 }
      );
    }

    // Choose a random account
    const randomAccount = accounts[Math.floor(Math.random() * accounts.length)];

    // List of premium buying signals
    const signalTemplates = [
      {
        type: "FUNDING",
        summary: "Closed Series C expansion funding of $45M led by Sequoia Capital.",
        score: 95,
      },
      {
        type: "HIRING",
        summary: "Opened 12 new high-velocity roles in strategic operations and procurement.",
        score: 88,
      },
      {
        type: "TOOLING",
        summary: "Deinstalled legacy competitor billing systems and added Salesforce hooks.",
        score: 84,
      },
      {
        type: "ENGAGEMENT",
        summary: "VP of talent operations visited product pricing page 4 times within 2 hours.",
        score: 91,
      },
      {
        type: "FUNDING",
        summary: "Secured $12M strategic round to accelerate enterprise distribution.",
        score: 89,
      },
      {
        type: "HIRING",
        summary: "Appointed new VP of Revenue and Director of Procurement stakeholders.",
        score: 94,
      },
    ];

    const chosen = signalTemplates[Math.floor(Math.random() * signalTemplates.length)];

    // Create the Signal record in SQLite
    const signal = await prisma.signal.create({
      data: {
        accountId: randomAccount.id,
        type: chosen.type,
        summary: `${randomAccount.name}: ${chosen.summary}`,
        score: chosen.score,
        happenedAt: new Date(),
      },
    });

    // Run Agentforce Signal playbook automation if score exceeds 75
    let automationResult = null;
    if (signal.score > 75) {
      try {
        const { processSignalAutomation } = await import("@/lib/services/automation-engine");
        automationResult = await processSignalAutomation(signal.id, actor);
      } catch (err: any) {
        console.error("Agentforce signal automation skipped or failed:", err);
      }
    }

    // Clean up cache or trigger side effects if needed (readiness invalidation is not strictly required for signals as they load fresh)
    return NextResponse.json({
      success: true,
      signal,
      accountName: randomAccount.name,
      automation: automationResult
    });
  } catch (error: any) {
    console.error("Signal simulation route failed", error);
    return NextResponse.json(
      { error: "Failed to simulate buying signal." },
      { status: 500 }
    );
  }
}

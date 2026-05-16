import { NextResponse } from "next/server";
import { getActorFromRequest } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import { resolveWorkspaceScope } from "@/lib/services/workspace";
import { getUserAISettings } from "@/lib/services/ai-settings";

export async function GET(request: Request) {
  try {
    const actor = getActorFromRequest(request);
    const prisma = getPrismaClient();
    
    if (!prisma) {
      return NextResponse.json({
        accounts: 0,
        contacts: 0,
        signals: 0,
        tasks: 0,
        approvals: 0,
        hasApiKey: false
      });
    }

    const workspaceScope = await resolveWorkspaceScope(prisma, actor).catch(() => null);
    
    let accountsCount = 0;
    let contactsCount = 0;
    let signalsCount = 0;
    let tasksCount = 0;
    let approvalsCount = 0;
    let hasApiKey = false;

    if (workspaceScope?.workspaceId) {
      const workspaceId = workspaceScope.workspaceId;
      
      const [accounts, contacts, signals, tasks, approvals, aiSettings] = await Promise.all([
        prisma.account.count({ where: { workspaceId } }),
        prisma.contact.count({ where: { account: { workspaceId } } }),
        prisma.signal.count({ where: { account: { workspaceId } } }),
        prisma.task.count({ where: { deal: { account: { workspaceId } } } }),
        prisma.outboundApproval.count({ where: { deal: { account: { workspaceId } } } }),
        getUserAISettings(actor).catch(() => ({ hasApiKey: false }))
      ]);

      accountsCount = accounts;
      contactsCount = contacts;
      signalsCount = signals;
      tasksCount = tasks;
      approvalsCount = approvals;
      hasApiKey = aiSettings.hasApiKey;
    }

    return NextResponse.json({
      accounts: accountsCount,
      contacts: contactsCount,
      signals: signalsCount,
      tasks: tasksCount,
      approvals: approvalsCount,
      hasApiKey
    });
  } catch (error) {
    console.error("Failed to load onboarding status", error);
    return NextResponse.json({ error: "Failed to load onboarding status." }, { status: 500 });
  }
}

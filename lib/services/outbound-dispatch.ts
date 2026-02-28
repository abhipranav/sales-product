import { randomUUID } from "crypto";
import { getPrismaClient } from "@/lib/db/prisma";

type OutboundDispatchChannel = "EMAIL" | "PHONE" | "LINKEDIN" | "MEETING";

interface DispatchApprovedOutboundInput {
  dealId: string;
  approvalId: string;
  channel: OutboundDispatchChannel;
  subject: string;
  body: string;
  actor: string;
}

interface OutboundDispatchResult {
  status: "sent" | "already-sent";
  provider: string;
  providerMessageId: string;
  sentAt: string;
}

export class OutboundDispatchServiceUnavailableError extends Error {
  constructor() {
    super("Outbound dispatch service unavailable because database is not configured.");
    this.name = "OutboundDispatchServiceUnavailableError";
  }
}

function normalizePreview(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 240);
}

function parseExistingMessageId(details: string): string | null {
  const match = details.match(/messageId=([^\s]+)/);
  return match?.[1] ?? null;
}

export async function dispatchApprovedOutbound(input: DispatchApprovedOutboundInput): Promise<OutboundDispatchResult> {
  const prisma = getPrismaClient();

  if (!prisma) {
    throw new OutboundDispatchServiceUnavailableError();
  }

  const existing = await prisma.auditLog.findFirst({
    where: {
      dealId: input.dealId,
      entityType: "outbound-send",
      entityId: input.approvalId,
      action: "outbound.sent"
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (existing) {
    return {
      status: "already-sent",
      provider: process.env.APP_OUTBOUND_PROVIDER?.trim() || "mock",
      providerMessageId: parseExistingMessageId(existing.details) ?? `existing_${input.approvalId}`,
      sentAt: existing.createdAt.toISOString()
    };
  }

  const provider = process.env.APP_OUTBOUND_PROVIDER?.trim() || "mock";
  const sentAt = new Date();
  const providerMessageId = `${provider}_${sentAt.getTime()}_${randomUUID().slice(0, 8)}`;
  const subject = input.subject.replace(/\s+/g, " ").trim().slice(0, 140);
  const preview = normalizePreview(input.body);

  await prisma.auditLog.create({
    data: {
      dealId: input.dealId,
      entityType: "outbound-send",
      entityId: input.approvalId,
      action: "outbound.sent",
      actor: input.actor,
      details: `[${input.channel}] provider=${provider} messageId=${providerMessageId} subject="${subject}" preview="${preview}"`
    }
  });

  return {
    status: "sent",
    provider,
    providerMessageId,
    sentAt: sentAt.toISOString()
  };
}

import { z } from "zod";
import { Prisma } from "@prisma/client";
import type { ActorIdentity } from "@/lib/auth/actor";
import { getPrismaClient } from "@/lib/db/prisma";
import { resolveWorkspaceScope } from "@/lib/services/workspace";

const themePreferenceSchema = z.enum(["system", "light", "dark"]);
const weekStartsOnSchema = z.enum(["monday", "sunday"]);
let settingsSchemaUnavailable = false;

const updateUserSettingsSchema = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    themePreference: themePreferenceSchema.optional(),
    timezone: z.string().min(2).max(120).optional(),
    locale: z.string().min(2).max(20).optional(),
    weekStartsOn: weekStartsOnSchema.optional(),
    compactMode: z.boolean().optional(),
    reduceMotion: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    desktopNotifications: z.boolean().optional(),
    mentionNotifications: z.boolean().optional(),
    pipelineAlerts: z.boolean().optional(),
    approvalQueueAlerts: z.boolean().optional(),
    dailyDigest: z.boolean().optional(),
    digestHour: z.number().int().min(0).max(23).optional(),
    loginAlerts: z.boolean().optional(),
    productAnnouncements: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided."
  });

export class UserSettingsServiceUnavailableError extends Error {
  constructor(message = "User settings service unavailable because database is not configured.") {
    super(message);
    this.name = "UserSettingsServiceUnavailableError";
  }
}

export function parseUpdateUserSettingsInput(payload: unknown) {
  return updateUserSettingsSchema.parse(payload);
}

type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;

type UserRole = "owner" | "manager" | "rep";

function mapRole(role: "OWNER" | "MANAGER" | "REP"): UserRole {
  if (role === "OWNER") {
    return "owner";
  }

  if (role === "MANAGER") {
    return "manager";
  }

  return "rep";
}

function toBoolean(value: boolean | undefined, fallback: boolean): boolean {
  return value === undefined ? fallback : value;
}

function isMissingSettingsSchemaError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2021" || error.code === "P2022");
}

function fallbackIdentity(actor?: ActorIdentity) {
  return {
    email: actor?.email ?? process.env.APP_ACTOR_EMAIL ?? "rep@aurora.local",
    fullName: actor?.name ?? process.env.APP_ACTOR_NAME ?? "Default Rep",
    role: "owner" as UserRole,
    workspaceSlug: process.env.APP_WORKSPACE_SLUG ?? "aurora-main",
    workspaceName: process.env.APP_WORKSPACE_NAME ?? "Aurora Main Workspace"
  };
}

function buildDefaultSettings(actor?: ActorIdentity) {
  const identity = fallbackIdentity(actor);

  return {
    profile: {
      email: identity.email,
      fullName: identity.fullName,
      role: identity.role,
      workspaceSlug: identity.workspaceSlug,
      workspaceName: identity.workspaceName
    },
    preferences: {
      themePreference: "system" as const,
      timezone: "UTC",
      locale: "en-US",
      weekStartsOn: "monday" as const,
      compactMode: false,
      reduceMotion: false
    },
    notifications: {
      emailNotifications: true,
      desktopNotifications: true,
      mentionNotifications: true,
      pipelineAlerts: true,
      approvalQueueAlerts: true,
      dailyDigest: false,
      digestHour: 8,
      productAnnouncements: true
    },
    security: {
      loginAlerts: true,
      mfaEnabled: false
    },
    capabilities: {
      canManageMembers: true,
      canManageBilling: true
    },
    source: "fallback" as const
  };
}

export async function getUserSettings(actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    return buildDefaultSettings(actor);
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    return buildDefaultSettings(actor);
  }

  if (settingsSchemaUnavailable) {
    return buildDefaultSettings(actor);
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_email: {
          workspaceId: workspaceScope.workspaceId,
          email: workspaceScope.actorEmail
        }
      }
    });

    if (!member) {
      throw new UserSettingsServiceUnavailableError();
    }

    const preference = await prisma.userPreference.upsert({
      where: {
        workspaceMemberId: member.id
      },
      create: {
        workspaceMemberId: member.id
      },
      update: {}
    });

    const role = mapRole(member.role);
    const isAdmin = role === "owner" || role === "manager";

    return {
      profile: {
        email: member.email,
        fullName: member.fullName,
        role,
        workspaceSlug: workspaceScope.workspaceSlug,
        workspaceName: workspaceScope.workspaceName
      },
      preferences: {
        themePreference: themePreferenceSchema.parse(preference.themePreference),
        timezone: preference.timezone,
        locale: preference.locale,
        weekStartsOn: weekStartsOnSchema.parse(preference.weekStartsOn),
        compactMode: preference.compactMode,
        reduceMotion: preference.reduceMotion
      },
      notifications: {
        emailNotifications: preference.emailNotifications,
        desktopNotifications: preference.desktopNotifications,
        mentionNotifications: preference.mentionNotifications,
        pipelineAlerts: preference.pipelineAlerts,
        approvalQueueAlerts: preference.approvalQueueAlerts,
        dailyDigest: preference.dailyDigest,
        digestHour: preference.digestHour,
        productAnnouncements: preference.productAnnouncements
      },
      security: {
        loginAlerts: preference.loginAlerts,
        mfaEnabled: false
      },
      capabilities: {
        canManageMembers: isAdmin,
        canManageBilling: role === "owner"
      },
      source: "database" as const
    };
  } catch (error) {
    if (isMissingSettingsSchemaError(error)) {
      settingsSchemaUnavailable = true;
      return buildDefaultSettings(actor);
    }

    throw error;
  }
}

export async function updateUserSettings(input: UpdateUserSettingsInput, actor?: ActorIdentity) {
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new UserSettingsServiceUnavailableError();
  }

  const workspaceScope = await resolveWorkspaceScope(prisma, actor);
  if (!workspaceScope?.workspaceId) {
    throw new UserSettingsServiceUnavailableError();
  }

  if (settingsSchemaUnavailable) {
    throw new UserSettingsServiceUnavailableError("UserPreference table is missing. Run `npm run db:push`.");
  }

  try {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_email: {
          workspaceId: workspaceScope.workspaceId,
          email: workspaceScope.actorEmail
        }
      }
    });

    if (!member) {
      throw new UserSettingsServiceUnavailableError();
    }

    if (input.fullName && input.fullName !== member.fullName) {
      await prisma.workspaceMember.update({
        where: {
          id: member.id
        },
        data: {
          fullName: input.fullName
        }
      });
    }

    await prisma.userPreference.upsert({
      where: {
        workspaceMemberId: member.id
      },
      create: {
        workspaceMemberId: member.id,
        themePreference: input.themePreference ?? "system",
        timezone: input.timezone ?? "UTC",
        locale: input.locale ?? "en-US",
        weekStartsOn: input.weekStartsOn ?? "monday",
        compactMode: toBoolean(input.compactMode, false),
        reduceMotion: toBoolean(input.reduceMotion, false),
        emailNotifications: toBoolean(input.emailNotifications, true),
        desktopNotifications: toBoolean(input.desktopNotifications, true),
        mentionNotifications: toBoolean(input.mentionNotifications, true),
        pipelineAlerts: toBoolean(input.pipelineAlerts, true),
        approvalQueueAlerts: toBoolean(input.approvalQueueAlerts, true),
        dailyDigest: toBoolean(input.dailyDigest, false),
        digestHour: input.digestHour ?? 8,
        loginAlerts: toBoolean(input.loginAlerts, true),
        productAnnouncements: toBoolean(input.productAnnouncements, true)
      },
      update: {
        themePreference: input.themePreference,
        timezone: input.timezone,
        locale: input.locale,
        weekStartsOn: input.weekStartsOn,
        compactMode: input.compactMode,
        reduceMotion: input.reduceMotion,
        emailNotifications: input.emailNotifications,
        desktopNotifications: input.desktopNotifications,
        mentionNotifications: input.mentionNotifications,
        pipelineAlerts: input.pipelineAlerts,
        approvalQueueAlerts: input.approvalQueueAlerts,
        dailyDigest: input.dailyDigest,
        digestHour: input.digestHour,
        loginAlerts: input.loginAlerts,
        productAnnouncements: input.productAnnouncements
      }
    });
  } catch (error) {
    if (isMissingSettingsSchemaError(error)) {
      settingsSchemaUnavailable = true;
      throw new UserSettingsServiceUnavailableError("UserPreference table is missing. Run `npm run db:push`.");
    }

    throw error;
  }

  return getUserSettings(actor);
}

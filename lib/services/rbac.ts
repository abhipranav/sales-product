/**
 * RBAC role gate utilities.
 *
 * Provides permission checks based on the actor's workspace role.
 * Roles hierarchy: owner > manager > rep
 */

import type { WorkspaceScope } from "@/lib/services/workspace";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type WorkspaceRole = "owner" | "manager" | "rep";
export type Permission =
  | "workspace.manage"
  | "members.manage"
  | "integrations.manage"
  | "approvals.override"
  | "settings.edit"
  | "settings.view"
  | "reports.view"
  | "tasks.manage"
  | "tasks.view"
  | "deals.manage"
  | "deals.view";

/* ------------------------------------------------------------------ */
/*  Role-Permission Matrix                                             */
/* ------------------------------------------------------------------ */

const rolePermissions: Record<WorkspaceRole, Set<Permission>> = {
  owner: new Set([
    "workspace.manage",
    "members.manage",
    "integrations.manage",
    "approvals.override",
    "settings.edit",
    "settings.view",
    "reports.view",
    "tasks.manage",
    "tasks.view",
    "deals.manage",
    "deals.view",
  ]),
  manager: new Set([
    "members.manage",
    "integrations.manage",
    "approvals.override",
    "settings.edit",
    "settings.view",
    "reports.view",
    "tasks.manage",
    "tasks.view",
    "deals.manage",
    "deals.view",
  ]),
  rep: new Set([
    "settings.view",
    "reports.view",
    "tasks.manage",
    "tasks.view",
    "deals.manage",
    "deals.view",
  ]),
};

/* ------------------------------------------------------------------ */
/*  Role Hierarchy                                                     */
/* ------------------------------------------------------------------ */

const roleRank: Record<WorkspaceRole, number> = {
  owner: 3,
  manager: 2,
  rep: 1,
};

/* ------------------------------------------------------------------ */
/*  Permission Check Functions                                         */
/* ------------------------------------------------------------------ */

export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return rolePermissions[role]?.has(permission) ?? false;
}

export function hasMinRole(role: WorkspaceRole, requiredRole: WorkspaceRole): boolean {
  return roleRank[role] >= roleRank[requiredRole];
}

export function getPermissions(role: WorkspaceRole): Permission[] {
  return Array.from(rolePermissions[role] ?? []);
}

/* ------------------------------------------------------------------ */
/*  Error                                                              */
/* ------------------------------------------------------------------ */

export class InsufficientPermissionError extends Error {
  constructor(action: string, requiredRole: WorkspaceRole, actualRole: WorkspaceRole) {
    super(`Insufficient permission for ${action}. Required: ${requiredRole}, actual: ${actualRole}.`);
    this.name = "InsufficientPermissionError";
  }
}

/* ------------------------------------------------------------------ */
/*  Enforcement helpers                                                */
/* ------------------------------------------------------------------ */

export function enforcePermission(scope: WorkspaceScope | null, permission: Permission, action: string): void {
  if (!scope) {
    // No workspace scope — skip enforcement (pre-tenancy mode)
    return;
  }

  if (!hasPermission(scope.actorRole, permission)) {
    throw new InsufficientPermissionError(action, "manager", scope.actorRole);
  }
}

export function enforceMinRole(scope: WorkspaceScope | null, requiredRole: WorkspaceRole, action: string): void {
  if (!scope) {
    return;
  }

  if (!hasMinRole(scope.actorRole, requiredRole)) {
    throw new InsufficientPermissionError(action, requiredRole, scope.actorRole);
  }
}

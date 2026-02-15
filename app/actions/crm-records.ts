"use server";

import { getActorFromServerContext } from "@/lib/auth/actor";
import {
  CrmRecordNotFoundError,
  CrmServiceUnavailableError,
  createAccount,
  createContact,
  createDeal,
  deleteDeal,
  parseCreateAccountInput,
  parseCreateContactInput,
  parseCreateDealInput,
  parseUpdateAccountInput,
  parseUpdateContactInput,
  parseUpdateDealInput,
  updateAccount,
  updateContact,
  updateDeal
} from "@/lib/services/crm-records";
import { revalidateDashboardViews } from "@/lib/services/cache-invalidation";
import { WorkspaceAccessDeniedError } from "@/lib/services/workspace";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "actions/crm-records" });

function optionalTrim(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  return raw.length > 0 ? raw : undefined;
}

function normalizeDateTime(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

export async function createAccountAction(formData: FormData) {
  try {
    const actor = await getActorFromServerContext();
    const payload = parseCreateAccountInput({
      name: String(formData.get("name") ?? "").trim(),
      segment: String(formData.get("segment") ?? "mid-market"),
      website: optionalTrim(formData, "website"),
      employeeBand: optionalTrim(formData, "employeeBand")
    });

    await createAccount(payload, actor);
    revalidateDashboardViews();
    log.info("Account created", { action: "create" });
  } catch (error) {
    if (error instanceof CrmServiceUnavailableError || error instanceof WorkspaceAccessDeniedError) {
      log.warn("Account creation skipped", { action: "create" }, error);
      return;
    }
    log.error("Create account action failed", { action: "create" }, error);
  }
}

export async function updateAccountAction(formData: FormData) {
  const accountId = String(formData.get("accountId") ?? "").trim();
  if (!accountId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    const payload = parseUpdateAccountInput({
      name: optionalTrim(formData, "name"),
      segment: optionalTrim(formData, "segment"),
      website: optionalTrim(formData, "website"),
      employeeBand: optionalTrim(formData, "employeeBand")
    });

    await updateAccount(accountId, payload, actor);
    revalidateDashboardViews();
    log.info("Account updated", { action: "update", accountId });
  } catch (error) {
    if (
      error instanceof CrmServiceUnavailableError ||
      error instanceof CrmRecordNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Account update skipped", { action: "update", accountId }, error);
      return;
    }
    log.error("Update account action failed", { action: "update", accountId }, error);
  }
}

export async function createContactAction(formData: FormData) {
  try {
    const actor = await getActorFromServerContext();
    const payload = parseCreateContactInput({
      accountId: String(formData.get("accountId") ?? "").trim(),
      fullName: String(formData.get("fullName") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      email: optionalTrim(formData, "email"),
      linkedInUrl: optionalTrim(formData, "linkedInUrl"),
      role: String(formData.get("role") ?? "influencer")
    });

    await createContact(payload, actor);
    revalidateDashboardViews();
    log.info("Contact created", { action: "create", accountId: payload.accountId });
  } catch (error) {
    if (
      error instanceof CrmServiceUnavailableError ||
      error instanceof CrmRecordNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Contact creation skipped", { action: "create" }, error);
      return;
    }
    log.error("Create contact action failed", { action: "create" }, error);
  }
}

export async function updateContactAction(formData: FormData) {
  const contactId = String(formData.get("contactId") ?? "").trim();
  if (!contactId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    const payload = parseUpdateContactInput({
      fullName: optionalTrim(formData, "fullName"),
      title: optionalTrim(formData, "title"),
      email: optionalTrim(formData, "email"),
      linkedInUrl: optionalTrim(formData, "linkedInUrl"),
      role: optionalTrim(formData, "role")
    });

    await updateContact(contactId, payload, actor);
    revalidateDashboardViews();
    log.info("Contact updated", { action: "update", contactId });
  } catch (error) {
    if (
      error instanceof CrmServiceUnavailableError ||
      error instanceof CrmRecordNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Contact update skipped", { action: "update", contactId }, error);
      return;
    }
    log.error("Update contact action failed", { action: "update", contactId }, error);
  }
}

export async function createDealAction(formData: FormData) {
  try {
    const actor = await getActorFromServerContext();
    const payload = parseCreateDealInput({
      accountId: String(formData.get("accountId") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      stage: String(formData.get("stage") ?? "discovery"),
      amount: Number(formData.get("amount") ?? 0),
      confidence: Number(formData.get("confidence") ?? 0),
      closeDate: normalizeDateTime(optionalTrim(formData, "closeDate")),
      riskSummary: String(formData.get("riskSummary") ?? "").trim()
    });

    await createDeal(payload, actor);
    revalidateDashboardViews();
    log.info("Deal created", { action: "create", accountId: payload.accountId });
  } catch (error) {
    if (
      error instanceof CrmServiceUnavailableError ||
      error instanceof CrmRecordNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Deal creation skipped", { action: "create" }, error);
      return;
    }
    log.error("Create deal action failed", { action: "create" }, error);
  }
}

export async function updateDealAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "").trim();
  if (!dealId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    const payload = parseUpdateDealInput({
      name: optionalTrim(formData, "name"),
      stage: optionalTrim(formData, "stage"),
      amount: optionalTrim(formData, "amount"),
      confidence: optionalTrim(formData, "confidence"),
      closeDate: normalizeDateTime(optionalTrim(formData, "closeDate")),
      riskSummary: optionalTrim(formData, "riskSummary")
    });

    await updateDeal(dealId, payload, actor);
    revalidateDashboardViews();
    log.info("Deal updated", { action: "update", dealId });
  } catch (error) {
    if (
      error instanceof CrmServiceUnavailableError ||
      error instanceof CrmRecordNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Deal update skipped", { action: "update", dealId }, error);
      return;
    }
    log.error("Update deal action failed", { action: "update", dealId }, error);
  }
}

export async function deleteDealAction(formData: FormData) {
  const dealId = String(formData.get("dealId") ?? "").trim();
  if (!dealId) {
    return;
  }

  try {
    const actor = await getActorFromServerContext();
    await deleteDeal(dealId, actor);
    revalidateDashboardViews();
    log.info("Deal deleted", { action: "delete", dealId });
  } catch (error) {
    if (
      error instanceof CrmServiceUnavailableError ||
      error instanceof CrmRecordNotFoundError ||
      error instanceof WorkspaceAccessDeniedError
    ) {
      log.warn("Deal deletion skipped", { action: "delete", dealId }, error);
      return;
    }
    log.error("Delete deal action failed", { action: "delete", dealId }, error);
  }
}

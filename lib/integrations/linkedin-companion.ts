export interface LinkedInCaptureHints {
  companyName?: string;
  contactName?: string;
  contactTitle?: string;
  contactLinkedInUrl?: string;
}

function stripLinkedInBranding(value: string) {
  return value
    .replace(/\|\s*linkedin(?:\s*:\s*log in|$)/i, "")
    .replace(/\s*-\s*linkedin$/i, "")
    .trim();
}

function cleanValue(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : undefined;
}

function splitLinkedInTitle(title: string) {
  return stripLinkedInBranding(title)
    .split(" - ")
    .map((part) => cleanValue(part))
    .filter((part): part is string => Boolean(part));
}

function isLinkedInProfileUrl(sourceUrl: string) {
  return /linkedin\.com\/in\//i.test(sourceUrl);
}

function isLinkedInCompanyUrl(sourceUrl: string) {
  return /linkedin\.com\/company\//i.test(sourceUrl);
}

export function deriveLinkedInCaptureHints(sourceUrl?: string, sourceTitle?: string): LinkedInCaptureHints {
  const cleanedUrl = cleanValue(sourceUrl);
  const cleanedTitle = cleanValue(sourceTitle);

  if (!cleanedUrl && !cleanedTitle) {
    return {};
  }

  const titleParts = cleanedTitle ? splitLinkedInTitle(cleanedTitle) : [];

  if (cleanedUrl && isLinkedInCompanyUrl(cleanedUrl)) {
    return {
      companyName: cleanValue(titleParts[0] ?? stripLinkedInBranding(cleanedTitle ?? ""))
    };
  }

  if (cleanedUrl && isLinkedInProfileUrl(cleanedUrl)) {
    return {
      contactName: cleanValue(titleParts[0]),
      contactTitle: cleanValue(titleParts[1]),
      companyName: cleanValue(titleParts[2]),
      contactLinkedInUrl: cleanedUrl
    };
  }

  if (titleParts.length === 1) {
    return {
      companyName: titleParts[0]
    };
  }

  if (titleParts.length >= 2) {
    return {
      contactName: cleanValue(titleParts[0]),
      contactTitle: cleanValue(titleParts[1]),
      companyName: cleanValue(titleParts[2])
    };
  }

  return {};
}

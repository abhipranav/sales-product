import { describe, expect, it } from "vitest";
import { deriveLinkedInCaptureHints } from "@/lib/integrations/linkedin-companion";

describe("deriveLinkedInCaptureHints", () => {
  it("derives profile hints from a LinkedIn person page", () => {
    expect(
      deriveLinkedInCaptureHints(
        "https://www.linkedin.com/in/jane-doe-123456/",
        "Jane Doe - VP Sales - Acme Systems | LinkedIn"
      )
    ).toEqual({
      contactName: "Jane Doe",
      contactTitle: "VP Sales",
      companyName: "Acme Systems",
      contactLinkedInUrl: "https://www.linkedin.com/in/jane-doe-123456/"
    });
  });

  it("derives a company hint from a LinkedIn company page", () => {
    expect(
      deriveLinkedInCaptureHints(
        "https://www.linkedin.com/company/acme-systems/",
        "Acme Systems | LinkedIn"
      )
    ).toEqual({
      companyName: "Acme Systems"
    });
  });

  it("returns an empty object when no useful source data is present", () => {
    expect(deriveLinkedInCaptureHints(undefined, undefined)).toEqual({});
  });
});

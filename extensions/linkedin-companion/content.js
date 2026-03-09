// Content script: Scrapes LinkedIn profile/company data from the current page
// Injected on linkedin.com by the manifest

(function () {
  "use strict";

  function getText(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : null;
  }

  function getTexts(selector) {
    return Array.from(document.querySelectorAll(selector))
      .map((el) => el.textContent.trim())
      .filter(Boolean);
  }

  function getMetaContent(property) {
    const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return el ? el.getAttribute("content")?.trim() || null : null;
  }

  function isProfilePage() {
    return /linkedin\.com\/in\//i.test(window.location.href);
  }

  function isCompanyPage() {
    return /linkedin\.com\/company\//i.test(window.location.href);
  }

  function getSectionText(id) {
    try {
      const heading = document.getElementById(id);
      if (!heading) return null;
      
      const parent = heading.closest('section');
      if (!parent) return null;

      // Extract raw text from the section, removing "Show all XYZ" links and extra whitespace
      let text = parent.innerText || parent.textContent;
      if (!text) return null;

      // Clean up common LinkedIn UI text
      text = text.replace(/Show all \d+.*?➔/g, '');
      text = text.replace(/Show higher education.*?➔/g, '');
      text = text.replace(/Show skills.*?➔/g, '');
      
      // Remove the heading itself
      const headingText = heading.innerText || heading.textContent || '';
      if (headingText && text.startsWith(headingText)) {
        text = text.substring(headingText.length);
      }

      return text.trim().replace(/\n{3,}/g, '\n\n');
    } catch {
      return null;
    }
  }

  function scrapeProfile() {
    const name =
      getText(".text-heading-xlarge") ||
      getText("h1.top-card-layout__title") ||
      getMetaContent("og:title")?.split(" - ")[0] ||
      null;

    const headline =
      getText(".text-body-medium.break-words") ||
      getText(".top-card-layout__headline") ||
      null;

    let title = headline;
    let company = null;

    if (headline) {
      const atMatch = headline.match(/^(.+?)\s+at\s+(.+)$/i);
      const commaMatch = headline.match(/^(.+?),\s+(.+)$/);
      if (atMatch) {
        title = atMatch[1].trim();
        company = atMatch[2].trim();
      } else if (commaMatch) {
        title = commaMatch[1].trim();
        company = commaMatch[2].trim();
      }
    }

    if (!company) {
      company = getText(".pv-text-details__right-panel .inline-show-more-text--is-collapsed");
    }

    const location =
      getText(".text-body-small.inline.t-black--light.break-words") ||
      getText(".top-card__subline-item") ||
      null;

    const about = getSectionText('about');
    const experience = getSectionText('experience');
    const education = getSectionText('education');

    const profileUrl = window.location.href.split("?")[0].replace(/\/+$/, "");

    return {
      type: "profile",
      name,
      title,
      company,
      location,
      about,
      experience,
      education,
      profileUrl,
      pageTitle: document.title
    };
  }

  function scrapeCompany() {
    const name =
      getText("h1.org-top-card-summary__title") ||
      getText("h1.top-card-layout__title") ||
      getMetaContent("og:title")?.split(" |")[0] ||
      null;

    const industry =
      getText(".org-top-card-summary-info-list__info-item") ||
      null;

    const infos = getTexts(".org-top-card-summary-info-list__info-item");
    let employeeBand = null;
    for (const info of infos) {
      if (/\d+.*employees/i.test(info) || /\d+.*staff/i.test(info)) {
        employeeBand = info.trim();
        break;
      }
    }

    const website = getText("a.org-top-card-primary-actions__action-link");
    const tagline =
      getText(".org-top-card-summary__tagline") ||
      getText("p.top-card-layout__first-subline") ||
      null;

    return {
      type: "company",
      name,
      industry,
      employeeBand,
      website,
      tagline,
      pageTitle: document.title
    };
  }

  function scrapeCurrentPage() {
    if (isProfilePage()) {
      return scrapeProfile();
    }
    if (isCompanyPage()) {
      return scrapeCompany();
    }
    return {
      type: "unknown",
      pageTitle: document.title,
      url: window.location.href
    };
  }

  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "scrape") {
      try {
        const data = scrapeCurrentPage();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    }
    return true; // keep channel open for async
  });
})();

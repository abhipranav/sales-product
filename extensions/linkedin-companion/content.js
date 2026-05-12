// Content script: Scrapes LinkedIn profile/company data from the current page
// Injected on linkedin.com by the manifest

(function () {
  "use strict";

  // Helper: Get text content of first matching selector
  function getText(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : null;
  }

  // Helper: Get array of text content for matching selectors
  function getTexts(selector) {
    return Array.from(document.querySelectorAll(selector))
      .map((el) => el.textContent.trim())
      .filter(Boolean);
  }

  // Helper: Get meta tag content
  function getMetaContent(property) {
    const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    return el ? el.getAttribute("content")?.trim() || null : null;
  }

  // Detect Profile Pages (Standard & Sales Navigator)
  function isProfilePage() {
    const url = window.location.href;
    return /linkedin\.com\/in\//i.test(url) || /linkedin\.com\/sales\/(?:profile|people|view|work-entity\/profile)\//i.test(url);
  }

  // Detect Company Pages (Standard & Sales Navigator)
  function isCompanyPage() {
    const url = window.location.href;
    return /linkedin\.com\/company\//i.test(url) || /linkedin\.com\/sales\/(?:company|accounts|work-entity\/company)\//i.test(url);
  }

  // Helper: Parse JSON-LD metadata embedded in LinkedIn pages for bulletproof extraction
  function getJsonLdData() {
    try {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        const data = JSON.parse(script.textContent);
        if (data && (data['@type'] === 'Person' || data['@type'] === 'Organization' || data['@graph'])) {
          return data;
        }
      }
    } catch (e) {
      console.warn("JSON-LD parsing failed:", e);
    }
    return null;
  }

  // Helper: Clean pronouns, emojis, degrees, and certifications from names
  function cleanName(name) {
    if (!name) return null;
    
    // 1. Remove emojis and special characters/symbols
    let cleaned = name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{1F200}-\u{1F2FF}]/gu, '');
    
    // 2. Remove pronouns e.g., (He/Him), [She/Her], (They/Them), (she/her/hers), / he / him
    cleaned = cleaned.replace(/\s*[\(\[\/]\s*(?:he|she|they|him|her|them|hers|his)\s*(?:\/\s*(?:him|her|them|his|hers|he|she|they)\s*)*[\)\]]?/gi, '');
    cleaned = cleaned.replace(/\s*,\s*(?:he|she|they|him|her|them|his|hers)\b/gi, '');
    
    // 3. Remove common professional suffixes/degrees separated by comma
    cleaned = cleaned.replace(/\s*,\s*(?:Ph\.?D|P\.?M\.?P|M\.?B\.?A|M\.?D|M\.?S|P\.?E|C\.?F\.?A|Dr\.?|Inc\.?|L\.?L\.?C)\b.*/gi, '');
    
    // Clean up spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned.length > 0 ? cleaned : name.trim();
  }

  // Helper: Scraping specific profile/company sections robustly by traversing headings
  function getSectionText(id) {
    try {
      // Try ID directly
      let element = document.getElementById(id);
      
      // Try section matching ID
      if (!element) {
        element = document.querySelector(`section#${id}`);
      }
      
      // Look for section headers containing target text
      if (!element) {
        const headings = Array.from(document.querySelectorAll('section h2, h2, h3, h4'));
        const targetHeading = headings.find(h => {
          const text = h.textContent.trim().toLowerCase();
          return text === id || text.startsWith(id) || text.includes(id);
        });
        if (targetHeading) {
          element = targetHeading.closest('section') || targetHeading.parentElement;
        }
      }
      
      // Try aria-label or data-section attributes
      if (!element) {
        element = document.querySelector(`section[aria-label*="${id}" i]`) || 
                  document.querySelector(`[data-section="${id}"]`);
      }

      if (!element) return null;

      return cleanSectionText(element);
    } catch (e) {
      console.warn(`Error scraping section ${id}:`, e);
      return null;
    }
  }

  // Helper: Deep clean a section's text by pruning navigation elements, buttons, and hidden screen-reader strings
  function cleanSectionText(element) {
    if (!element) return null;
    
    // Clone element to avoid modifying the user's active page
    const clone = element.cloneNode(true);
    
    // Strip interactive widgets, inline editing triggers, buttons, icons, and hidden elements
    const noiseSelectors = [
      'button', 
      'a.pvs-profile-actions__action', 
      '.inline-show-more-text__button',
      '.artdeco-button',
      'li.pvs-list__item--hide-initial-cards',
      '.pvs-list__paged-list-item--last-child',
      '[aria-hidden="true"]',
      'svg',
      '.visually-hidden'
    ];
    
    noiseSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });
    
    let text = clone.innerText || clone.textContent || '';
    
    // Wipe common LinkedIn UI pagination and translation noise
    text = text.replace(/Show all \d+.*?➔/gi, '');
    text = text.replace(/Show higher education.*?➔/gi, '');
    text = text.replace(/Show skills.*?➔/gi, '');
    text = text.replace(/Show translation/gi, '');
    text = text.replace(/See all details/gi, '');
    text = text.replace(/Show more/gi, '');
    
    // Standardize paragraph line breaks and layout spaces
    text = text.trim()
               .replace(/\n\s*\n/g, '\n')
               .replace(/\s+/g, ' ')
               .replace(/\n+/g, '\n\n');
               
    return text.length > 0 ? text : null;
  }

  // Core Scraper: Profile Pages (Standard & Premium/Sales Navigator)
  function scrapeProfile() {
    let jsonLdName = null;
    let jsonLdTitle = null;
    let jsonLdCompany = null;
    let jsonLdLocation = null;
    
    // 1. Gather JSON-LD metadata for rock-solid extraction backup
    const jsonLd = getJsonLdData();
    if (jsonLd) {
      let person = null;
      if (jsonLd['@type'] === 'Person') {
        person = jsonLd;
      } else if (Array.isArray(jsonLd['@graph'])) {
        person = jsonLd['@graph'].find(item => item['@type'] === 'Person');
      }
      if (person) {
        jsonLdName = person.name;
        jsonLdTitle = person.jobTitle;
        jsonLdCompany = person.worksFor?.name || (Array.isArray(person.worksFor) ? person.worksFor[0]?.name : null);
        if (person.address) {
          jsonLdLocation = [person.address.addressLocality, person.address.addressRegion, person.address.addressCountry]
            .filter(Boolean)
            .join(', ');
        }
      }
    }

    // 2. Profile Name Extraction (covers all layouts)
    const rawName =
      getText(".text-heading-xlarge") ||
      getText(".pv-text-details__left-panel h1") ||
      getText("h1.top-card-layout__title") ||
      getText(".profile-topcard-person-details__name") ||
      getText("main h1") ||
      getText("h1[class*='name']") ||
      jsonLdName ||
      getMetaContent("og:title")?.split(" - ")[0] ||
      getMetaContent("og:title")?.split(" | ")[0] ||
      document.title.split(" - ")[0].split(" | ")[0] ||
      null;

    const name = cleanName(rawName);

    // 3. Headline/Title Extraction
    const headline =
      getText(".text-body-medium.break-words") ||
      getText(".pv-text-details__left-panel .text-body-medium") ||
      getText(".top-card-layout__headline") ||
      getText(".profile-topcard-person-details__headline") ||
      getText("div[class*='headline']") ||
      getText("[data-anonymize='headline']") ||
      jsonLdTitle ||
      null;

    let title = null;
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

    // 4. Fallback Title/Company via parsing first experience item
    let expTitle = null;
    let expCompany = null;
    try {
      let expSection = document.getElementById("experience")?.closest('section') || 
                        document.querySelector('section#experience') ||
                        Array.from(document.querySelectorAll('section')).find(s => {
                          const h2 = s.querySelector('h2');
                          return h2 && h2.textContent.toLowerCase().includes('experience');
                        });
                        
      if (expSection) {
        const firstItem = expSection.querySelector('li') || expSection.querySelector('.pvs-list__paged-list-item');
        if (firstItem) {
          const itemClone = firstItem.cloneNode(true);
          itemClone.querySelectorAll('button, svg, .visually-hidden').forEach(el => el.remove());
          const lines = (itemClone.innerText || itemClone.textContent || '')
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);
            
          if (lines.length > 0) {
            // Check if multiple roles at same company (look for duration phrases like 'yr' or 'mos')
            const hasMultipleRoles = lines.some(line => line.includes('yr') || line.includes('mos') || line.includes('yr ') || line.includes('mo '));
            
            if (lines[1] && (lines[1].includes('·') || lines[1].includes('Full-time') || lines[1].includes('Part-time') || lines[1].includes('Contract'))) {
              // Single role format
              expTitle = lines[0];
              expCompany = lines[1].split(' · ')[0].split(' ·')[0].split(' - ')[0].trim();
            } else if (lines.length >= 3 && (lines[2].includes('·') || lines[2].includes('Full-time') || lines[2].includes('Part-time'))) {
              expTitle = lines[0];
              expCompany = lines[1].trim();
            } else {
              // Nested or multiple roles layout
              expCompany = lines[0];
              const nestedTitleEl = firstItem.querySelector('span[aria-hidden="true"], [class*="title"]');
              if (nestedTitleEl) {
                expTitle = nestedTitleEl.textContent.trim();
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Failed parsing experience item fallback:", e);
    }

    // Prioritize experience extracted title and company
    if (!title || title === headline) {
      title = expTitle || jsonLdTitle || headline;
    }
    if (!company) {
      company = expCompany || jsonLdCompany ||
                getText(".pv-text-details__right-panel .inline-show-more-text--is-collapsed") ||
                getText("button[aria-label^='Current company:']") ||
                null;
    }

    // 5. Scrape Location
    const location =
      getText(".text-body-small.inline.t-black--light.break-words") ||
      getText(".pv-text-details__left-panel .text-body-small.inline") ||
      getText(".top-card__subline-item") ||
      getText(".profile-topcard-person-details__location") ||
      jsonLdLocation ||
      null;

    // 6. Complete Sections
    const about = getSectionText('about');
    const experience = getSectionText('experience');
    const education = getSectionText('education');

    const profileUrl = window.location.href.split("?")[0].replace(/\/+$/, "");

    return {
      type: "profile",
      name: name || "Unknown Name",
      title: title || headline || "Unknown Title",
      company: company || "Unknown Company",
      location,
      about,
      experience,
      education,
      profileUrl,
      pageTitle: document.title
    };
  }

  // Core Scraper: Company Pages (Standard & Sales Navigator Accounts)
  function scrapeCompany() {
    let jsonLdName = null;
    let jsonLdIndustry = null;
    let jsonLdWebsite = null;
    
    const jsonLd = getJsonLdData();
    if (jsonLd) {
      let org = null;
      if (jsonLd['@type'] === 'Organization' || jsonLd['@type'] === 'Corporation') {
        org = jsonLd;
      } else if (Array.isArray(jsonLd['@graph'])) {
        org = jsonLd['@graph'].find(item => item['@type'] === 'Organization' || item['@type'] === 'Corporation');
      }
      if (org) {
        jsonLdName = org.name;
        jsonLdIndustry = org.industry || org.knowsAbout;
        jsonLdWebsite = org.url || org.sameAs;
      }
    }

    const name =
      getText("h1.org-top-card-summary__title") ||
      getText("h1.top-card-layout__title") ||
      jsonLdName ||
      getMetaContent("og:title")?.split(" |")[0] ||
      getMetaContent("og:title")?.split(" - ")[0] ||
      null;

    const industry =
      getText(".org-top-card-summary-info-list__info-item") ||
      getText(".org-top-card-summary__industry") ||
      jsonLdIndustry ||
      null;

    const infos = getTexts(".org-top-card-summary-info-list__info-item");
    let employeeBand = null;
    for (const info of infos) {
      if (/\d+.*employees/i.test(info) || /\d+.*staff/i.test(info) || /\d+.*\-\d+/i.test(info)) {
        employeeBand = info.trim();
        break;
      }
    }

    // Try finding employee size in about page DT elements if missing
    if (!employeeBand) {
      try {
        const sizeEl = Array.from(document.querySelectorAll('dt')).find(dt => dt.textContent.toLowerCase().includes('company size'));
        if (sizeEl) {
          const dd = sizeEl.nextElementSibling;
          if (dd) {
            employeeBand = dd.textContent.replace(/on LinkedIn.*/i, '').trim();
          }
        }
      } catch {}
    }

    const website = 
      getText("a.org-top-card-primary-actions__action-link") ||
      document.querySelector("a[href*='linkedin.com/company/'] + a")?.getAttribute("href") ||
      jsonLdWebsite ||
      null;

    const tagline =
      getText(".org-top-card-summary__tagline") ||
      getText("p.top-card-layout__first-subline") ||
      null;

    return {
      type: "company",
      name: name || "Unknown Company",
      industry,
      employeeBand,
      website,
      tagline,
      pageTitle: document.title,
      url: window.location.href.split("?")[0].replace(/\/+$/, "")
    };
  }

  // Standard dispatcher based on tab location
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

  // Chrome communication listener
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "scrape") {
      try {
        const data = scrapeCurrentPage();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    }
    return true; // keep channel active
  });
})();

// Velocity LinkedIn Companion Popup Script

// Primary Elements
const baseUrlInput = document.getElementById("base-url");
const captureButton = document.getElementById("capture-btn");
const enrichButton = document.getElementById("enrich-btn");
const workbenchButton = document.getElementById("workbench-btn");
const emptyWorkbenchBtn = document.getElementById("empty-workbench-btn");
const scrapedSection = document.getElementById("scraped-section");
const emptyState = document.getElementById("empty-state");
const connectionDot = document.getElementById("connection-dot");
const pageTypeBadge = document.getElementById("page-type-badge");
const scannerWrapper = document.getElementById("scanner-wrapper");
const actionsContainer = document.getElementById("actions-container");

// Review Form Fields
const formName = document.getElementById("form-name");
const formTitle = document.getElementById("form-title");
const formCompany = document.getElementById("form-company");
const formLocation = document.getElementById("form-location");

// Collapsible Advanced Drawer
const advancedToggle = document.getElementById("advanced-toggle");
const advancedDrawer = document.getElementById("advanced-drawer");
const advancedToggleIcon = document.getElementById("advanced-toggle-icon");
const formWebsite = document.getElementById("form-website");
const formSize = document.getElementById("form-size");
const formSegment = document.getElementById("form-segment");
const formRole = document.getElementById("form-role");

// Progressive Loading Visualizer
const loaderContainer = document.getElementById("loader-container");
const step0 = document.getElementById("step-0");
const step1 = document.getElementById("step-1");
const step2 = document.getElementById("step-2");

// AI Enrichment Display Card
const enrichmentSection = document.getElementById("enrichment-section");
const seniorityBadge = document.getElementById("seniority-badge");
const relevanceScoreFill = document.getElementById("relevance-score-fill");
const relevanceScoreText = document.getElementById("relevance-score-text");
const executiveSummary = document.getElementById("executive-summary");
const suggestedIcebreaker = document.getElementById("suggested-icebreaker");
const copyHookBtn = document.getElementById("copy-hook-btn");

// Success Card
const successCard = document.getElementById("success-card");
const successMessage = document.getElementById("success-message");
const successAccBtn = document.getElementById("success-acc-btn");
const successConBtn = document.getElementById("success-con-btn");

// Toast Container
const toastContainer = document.getElementById("toast-container");

const DEFAULT_BASE_URL = "https://www.salescortex.me";
let scrapedData = null;

// Helper: Show Beautiful Toast Notification
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span style="font-weight: bold; font-size: 13px;">${type === "success" ? "✓" : "⚠"}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Load Saved Base URL
async function loadSavedBaseUrl() {
  const result = await chrome.storage.sync.get(["velocityBaseUrl"]);
  baseUrlInput.value = result.velocityBaseUrl || DEFAULT_BASE_URL;
}

// Auto-save Base URL on input change to prevent persistent production redirects
baseUrlInput.addEventListener("change", async () => {
  const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, "");
  if (baseUrl) {
    await chrome.storage.sync.set({ velocityBaseUrl: baseUrl });
    showToast("Local Base URL updated!", "success");
  }
});

// Toggle Advanced Drawer
advancedToggle.addEventListener("click", () => {
  const isOpen = advancedDrawer.classList.toggle("open");
  advancedToggleIcon.textContent = isOpen ? "▼" : "▶";
});

// Render Form with Scraped Data
function fillScrapedForm(data) {
  scrapedSection.style.display = "block";
  emptyState.style.display = "none";
  captureButton.disabled = false;

  formName.value = data.name || "";
  formTitle.value = data.title || "";
  formCompany.value = data.company || "";
  formLocation.value = data.location || "";
  formWebsite.value = data.website || "";
  formSize.value = data.employeeBand || "";

  if (data.type === "profile") {
    enrichButton.style.display = "block";
    enrichButton.disabled = false;
    pageTypeBadge.textContent = "👤 PROFILE";
  } else if (data.type === "company") {
    enrichButton.style.display = "none";
    pageTypeBadge.textContent = "🏢 COMPANY";
  } else {
    enrichButton.style.display = "none";
    pageTypeBadge.textContent = "❓ OTHER";
    captureButton.disabled = true;
  }
}

// Perform active tab scrape
async function scrapeCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      return null;
    }

    if (!/linkedin\.com/i.test(tab.url)) {
      showToast("Navigate to a LinkedIn page.", "error");
      return null;
    }

    connectionDot.classList.remove("inactive");
    connectionDot.classList.add("active");
    connectionDot.title = "Connected to LinkedIn";

    const response = await chrome.tabs.sendMessage(tab.id, { action: "scrape" });
    if (response && response.success) {
      return response.data;
    }

    // Fallback: parse tab details if content script is unavailable
    return {
      type: /\/in\//i.test(tab.url) ? "profile" : /\/company\//i.test(tab.url) ? "company" : "unknown",
      pageTitle: tab.title,
      url: tab.url
    };
  } catch {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && /linkedin\.com/i.test(tab.url)) {
      connectionDot.classList.remove("inactive");
      connectionDot.classList.add("active");
      return {
        type: /\/in\//i.test(tab.url) ? "profile" : /\/company\//i.test(tab.url) ? "company" : "unknown",
        pageTitle: tab.title,
        url: tab.url
      };
    }
    return null;
  }
}

// Progressive Loader state management
function setLoaderState(action, state) {
  if (state === "start") {
    scrapedSection.style.display = "none";
    enrichmentSection.style.display = "none";
    successCard.style.display = "none";
    actionsContainer.style.display = "none";
    
    loaderContainer.style.display = "flex";
    scannerWrapper.classList.add("scanning");
    
    step0.className = "loader-step done";
    step1.className = "loader-step";
    step2.className = "loader-step";
    
    if (action === "enrich") {
      step1.className = "loader-step active";
    } else {
      step1.className = "loader-step done";
      step2.className = "loader-step active";
    }
  } else if (state === "end") {
    loaderContainer.style.display = "none";
    scannerWrapper.classList.remove("scanning");
    actionsContainer.style.display = "flex";
    
    if (action === "enrich") {
      scrapedSection.style.display = "block";
      enrichmentSection.style.display = "block";
    } else {
      successCard.style.display = "block";
    }
  }
}

// AI Enrichment execution
async function runAiEnrichment() {
  if (!scrapedData) return;

  const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    showToast("Velocity CRM App URL is required.", "error");
    return;
  }

  setLoaderState("enrich", "start");

  try {
    const enrichUrl = `${baseUrl}/api/integrations/linkedin/enrich`;
    
    const body = {
      contactName: formName.value.trim(),
      contactTitle: formTitle.value.trim(),
      companyName: formCompany.value.trim(),
      about: scrapedData.about,
      experience: scrapedData.experience,
      education: scrapedData.education
    };

    const response = await fetch(enrichUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.summary) {
        const brief = result.summary;
        
        // Executive Summary
        executiveSummary.textContent = brief.executiveSummary || "No executive summary parsed.";
        
        // Suggested Icebreaker
        suggestedIcebreaker.textContent = brief.suggestedIcebreaker || "No custom hook generated.";
        
        // Seniority Badge mapping
        const seniority = brief.estimatedSeniority || "Unknown";
        seniorityBadge.textContent = seniority.toUpperCase();
        seniorityBadge.className = "seniority-badge"; // reset
        
        if (["executive", "vp", "c-level"].includes(seniority.toLowerCase())) {
          seniorityBadge.classList.add("executive");
        } else if (seniority.toLowerCase() === "director") {
          seniorityBadge.classList.add("director");
        } else if (seniority.toLowerCase() === "manager") {
          seniorityBadge.classList.add("manager");
        } else {
          seniorityBadge.classList.add("contributor");
        }

        // Relevance Score bar mapping
        const score = typeof brief.salesRelevance === "number" ? brief.salesRelevance : 5;
        relevanceScoreText.textContent = `${score}/10`;
        relevanceScoreFill.style.width = `${score * 10}%`;

        showToast("AI Sales Brief compiled successfully!", "success");
      } else {
        throw new Error("Failed to load AI Sales Brief summaries.");
      }
    } else {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server status ${response.status}`);
    }
  } catch (error) {
    showToast(error.message || "Enrichment failed. Please log in first.", "error");
    enrichmentSection.style.display = "none";
  } finally {
    setLoaderState("enrich", "end");
  }
}

// Copy icebreaker opening hook to clipboard
copyHookBtn.addEventListener("click", async () => {
  const hookText = suggestedIcebreaker.textContent;
  if (!hookText || hookText.startsWith("Extracting") || hookText.startsWith("No custom")) {
    return;
  }

  try {
    await navigator.clipboard.writeText(hookText);
    copyHookBtn.classList.add("copied");
    const originalSvg = copyHookBtn.innerHTML;
    copyHookBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
    showToast("Icebreaker copied to clipboard!", "success");
    
    setTimeout(() => {
      copyHookBtn.classList.remove("copied");
      copyHookBtn.innerHTML = originalSvg;
    }, 1500);
  } catch {
    showToast("Failed to copy clipboard text.", "error");
  }
});

// Capture Form Details directly to CRM API
async function captureToApi() {
  if (!scrapedData) return;

  const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    showToast("Velocity CRM App URL is required.", "error");
    return;
  }

  // Save the URL preference
  await chrome.storage.sync.set({ velocityBaseUrl: baseUrl });

  setLoaderState("capture", "start");

  try {
    const captureUrl = `${baseUrl}/api/integrations/linkedin/capture`;
    
    const body = {
      sourceUrl: scrapedData.profileUrl || scrapedData.url,
      sourceTitle: scrapedData.pageTitle,
      segment: formSegment.value,
      contactRole: formRole.value
    };

    // Only set variables if non-empty
    const nameVal = formName.value.trim();
    const titleVal = formTitle.value.trim();
    const companyVal = formCompany.value.trim();
    const locVal = formLocation.value.trim();
    const webVal = formWebsite.value.trim();
    const sizeVal = formSize.value.trim();

    if (scrapedData.type === "profile") {
      body.contactName = nameVal;
      body.contactTitle = titleVal;
      body.companyName = companyVal;
      body.contactLinkedInUrl = scrapedData.profileUrl || scrapedData.url;
      if (webVal) body.companyWebsite = webVal;
      if (sizeVal) body.employeeBand = sizeVal;
    } else if (scrapedData.type === "company") {
      body.companyName = companyVal || nameVal;
      if (webVal) body.companyWebsite = webVal;
      if (sizeVal) body.employeeBand = sizeVal;
    }

    const response = await fetch(captureUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const result = await response.json();
      
      const accountName = result.account?.name || "Company";
      const recordStatus = result.account?.status || "captured";
      
      successMessage.innerHTML = `
        <strong>${accountName.toUpperCase()}</strong> has been captured successfully as a <strong>${recordStatus.toUpperCase()}</strong> account.
      `;
      
      // Wire Success redirection buttons
      successAccBtn.onclick = () => {
        chrome.tabs.create({ url: `${baseUrl}/accounts/${result.account.id}` });
      };

      if (result.contact) {
        successConBtn.style.display = "block";
        successConBtn.onclick = () => {
          chrome.tabs.create({ url: `${baseUrl}/contacts/${result.contact.id}` });
        };
      } else {
        successConBtn.style.display = "none";
      }

      showToast("Leads synced to CRM Database!", "success");
    } else {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `CRM API error: ${response.status}`);
    }
  } catch (error) {
    showToast(error.message || "Failed to capture. Check connection/login.", "error");
    // Show back form to retry
    scrapedSection.style.display = "block";
    actionsContainer.style.display = "flex";
  } finally {
    setLoaderState("capture", "end");
  }
}

// Navigation to Full Workbench
async function openWorkbench() {
  const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    showToast("Velocity CRM App URL is required.", "error");
    return;
  }

  await chrome.storage.sync.set({ velocityBaseUrl: baseUrl });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const targetUrl = new URL(`${baseUrl}/integrations/linkedin`);

  if (tab?.url) {
    targetUrl.searchParams.set("sourceUrl", tab.url);
  }
  if (tab?.title) {
    targetUrl.searchParams.set("sourceTitle", tab.title);
  }

  chrome.tabs.create({ url: targetUrl.toString() });
}

// Initial Loading
(async () => {
  await loadSavedBaseUrl();

  scrapedData = await scrapeCurrentTab();
  if (scrapedData) {
    fillScrapedForm(scrapedData);
  } else {
    connectionDot.classList.remove("active");
    connectionDot.classList.add("inactive");
    connectionDot.title = "Please go to a LinkedIn profile or company page.";
  }
})();

// Wire up Action Buttons
captureButton.addEventListener("click", captureToApi);
enrichButton.addEventListener("click", runAiEnrichment);
workbenchButton.addEventListener("click", openWorkbench);
emptyWorkbenchBtn.addEventListener("click", openWorkbench);

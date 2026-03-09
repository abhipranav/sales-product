const baseUrlInput = document.getElementById("base-url");
const captureButton = document.getElementById("capture-btn");
const workbenchButton = document.getElementById("workbench-btn");
const statusText = document.getElementById("status-text");
const scrapedSection = document.getElementById("scraped-section");
const scrapedDataContainer = document.getElementById("scraped-data");
const emptyState = document.getElementById("empty-state");
const connectionDot = document.getElementById("connection-dot");
const pageTypeBadge = document.getElementById("page-type-badge");

const DEFAULT_BASE_URL = "https://www.salescortex.me";

let scrapedData = null;

async function loadSavedBaseUrl() {
  const result = await chrome.storage.sync.get(["velocityBaseUrl"]);
  baseUrlInput.value = result.velocityBaseUrl || DEFAULT_BASE_URL;
}

function setStatus(message) {
  statusText.textContent = message;
}

function renderDataRow(key, value) {
  if (!value) return "";
  return `
    <div class="data-row">
      <span class="data-key">${key}</span>
      <span class="data-value" title="${value}">${value}</span>
    </div>
  `;
}

function renderScrapedData(data) {
  scrapedSection.style.display = "block";
  emptyState.style.display = "none";
  captureButton.disabled = false;

  if (data.type === "profile") {
    enrichButton.style.display = "block";
    enrichButton.disabled = false;
    pageTypeBadge.textContent = "👤 PROFILE";
    scrapedDataContainer.innerHTML = [
      renderDataRow("NAME", data.name),
      renderDataRow("TITLE", data.title),
      renderDataRow("COMPANY", data.company),
      renderDataRow("LOCATION", data.location),
    ]
      .filter(Boolean)
      .join("");
  } else if (data.type === "company") {
    enrichButton.style.display = "none";
    pageTypeBadge.textContent = "🏢 COMPANY";
    scrapedDataContainer.innerHTML = [
      renderDataRow("NAME", data.name),
      renderDataRow("INDUSTRY", data.industry),
      renderDataRow("SIZE", data.employeeBand),
      renderDataRow("WEBSITE", data.website),
      renderDataRow("TAGLINE", data.tagline),
    ]
      .filter(Boolean)
      .join("");
  } else {
    enrichButton.style.display = "none";
    pageTypeBadge.textContent = "❓ OTHER";
    scrapedDataContainer.innerHTML = renderDataRow("PAGE", data.pageTitle);
    captureButton.disabled = true;
  }
}

async function scrapeCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      return null;
    }

    if (!/linkedin\.com/i.test(tab.url)) {
      setStatus("Navigate to a LinkedIn page to capture data.");
      return null;
    }

    connectionDot.classList.remove("inactive");
    connectionDot.classList.add("active");
    connectionDot.title = "Connected to LinkedIn";

    const response = await chrome.tabs.sendMessage(tab.id, { action: "scrape" });
    if (response && response.success) {
      return response.data;
    }

    // Fallback: use tab title parsing if content script isn't ready
    return {
      type: /\/in\//i.test(tab.url) ? "profile" : /\/company\//i.test(tab.url) ? "company" : "unknown",
      pageTitle: tab.title,
      url: tab.url
    };
  } catch {
    // Content script might not be injected yet; use tab info
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

async function captureToApi() {
  if (!scrapedData) return;

  const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    setStatus("Enter your Velocity app URL first.");
    return;
  }

  await chrome.storage.sync.set({ velocityBaseUrl: baseUrl });
  captureButton.disabled = true;
  captureButton.textContent = "CAPTURING...";

  try {
    const apiUrl = `${baseUrl}/api/integrations/linkedin/capture`;
    const body = {};

    if (scrapedData.type === "profile") {
      body.sourceUrl = scrapedData.profileUrl || scrapedData.url;
      body.sourceTitle = scrapedData.pageTitle;
      body.contactName = scrapedData.name;
      body.contactTitle = scrapedData.title;
      body.companyName = scrapedData.company;
      body.contactLinkedInUrl = scrapedData.profileUrl;
      body.about = scrapedData.about;
      body.experience = scrapedData.experience;
      body.education = scrapedData.education;
    } else if (scrapedData.type === "company") {
      body.sourceUrl = scrapedData.url || window.location?.href;
      body.sourceTitle = scrapedData.pageTitle;
      body.companyName = scrapedData.name;
      body.companyWebsite = scrapedData.website;
      body.employeeBand = scrapedData.employeeBand;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const result = await response.json();
      const accountName = result.account?.name || "record";
      captureButton.textContent = `✓ CAPTURED: ${accountName.toUpperCase()}`;
      setStatus(`Saved to CRM as ${result.account?.status || "new"} record.`);
    } else {
      const error = await response.json();
      captureButton.textContent = "✨ CAPTURE TO CRM";
      captureButton.disabled = false;
      setStatus(error.error || `API error: ${response.status}`);
    }
  } catch (error) {
    captureButton.textContent = "✨ CAPTURE TO CRM";
    captureButton.disabled = false;
    setStatus("Failed to connect. Verify your app URL and sign in.");
  }
}

async function openWorkbench() {
  const baseUrl = baseUrlInput.value.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    setStatus("Enter your Velocity app URL first.");
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

  await chrome.tabs.create({ url: targetUrl.toString() });
}

// Initialize
(async () => {
  await loadSavedBaseUrl();

  scrapedData = await scrapeCurrentTab();
  if (scrapedData) {
    renderScrapedData(scrapedData);
  }
})();

captureButton.addEventListener("click", captureToApi);
workbenchButton.addEventListener("click", openWorkbench);

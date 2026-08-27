/**
 * Tamper Seal Log Web App - Frontend V2
 * Coordinated with Code_V2.gs
 *
 * Production design goals:
 * - Seal-level pending state (not whole-equipment blocking)
 * - Multi-role users via server capabilities
 * - Initial Seal users can choose Add Seal(s) or Request Break Seal
 * - Explicit processor Yes/No replacement decision; no default answer
 * - Double-click / duplicate-write protection on every write action
 * - Current server state is authoritative; no equipment-wide sessionStorage lock
 *
 * Expected V2 HTML additions (index.html V2 will provide these):
 * - equipmentActionView
 * - actionEquipmentSubtitle
 * - actionCurrentSeals
 * - actionAddSealBtn
 * - actionRequestBreakBtn
 * - addSealView
 * - addSealSubtitle
 * - addSealEquipment
 * - addSealExistingSeals
 * - addSealList
 * - addAnotherSealBtn
 * - addSealDateInitials
 * - addSealRemarks
 * - saveAddSealsBtn
 * - backFromAddSealBtn
 * - addSealSuccessView
 * - addSealSuccessMeta
 * - addMoreSealBtn
 * - requestAnotherBtn
 * - replacementDecisionHint (optional)
 */

(function () {
  "use strict";

  // Prevent duplicate initialization if the remote script is accidentally loaded twice.
  if (window.__TAMPER_SEAL_APP_INITIALIZED__) {
    console.warn("Tamper Seal app already initialized; second app.js load ignored.");
    return;
  }
  window.__TAMPER_SEAL_APP_INITIALIZED__ = true;
  window.__APP_JS_LOADED = true;
  window.__APP_VERSION__ = "20260827_v2_1_partial_processing";

  const PAGE_PARAMS = window.PAGE_PARAMS || {};
  const urlParams = new URLSearchParams(window.location.search || "");

  // ==================== OPTIONAL THEME ====================
  const seed = "#1D3B6E";
  const mcu = window.materialColorUtilities;
  const themeEnabled = false;

  function applyTheme() {
    if (!mcu || !themeEnabled) return;

    try {
      const { argbFromHex, themeFromSourceColor, hexFromArgb } = mcu;
      const theme = themeFromSourceColor(argbFromHex(seed));
      const light = theme.schemes.light;
      const vars = {
        "--md-sys-color-primary": hexFromArgb(light.primary),
        "--md-sys-color-on-primary": hexFromArgb(light.onPrimary),
        "--md-sys-color-primary-container": hexFromArgb(light.primaryContainer),
        "--md-sys-color-on-primary-container": hexFromArgb(light.onPrimaryContainer),
        "--md-sys-color-secondary": hexFromArgb(light.secondary),
        "--md-sys-color-on-secondary": hexFromArgb(light.onSecondary),
        "--md-sys-color-secondary-container": hexFromArgb(light.secondaryContainer),
        "--md-sys-color-on-secondary-container": hexFromArgb(light.onSecondaryContainer),
        "--md-sys-color-tertiary": hexFromArgb(light.tertiary),
        "--md-sys-color-on-tertiary": hexFromArgb(light.onTertiary),
        "--md-sys-color-error": hexFromArgb(light.error),
        "--md-sys-color-on-error": hexFromArgb(light.onError),
        "--md-sys-color-error-container": hexFromArgb(light.errorContainer),
        "--md-sys-color-on-error-container": hexFromArgb(light.onErrorContainer),
        "--md-sys-color-background": hexFromArgb(light.background),
        "--md-sys-color-on-background": hexFromArgb(light.onBackground),
        "--md-sys-color-surface": hexFromArgb(light.surface),
        "--md-sys-color-on-surface": hexFromArgb(light.onSurface),
        "--md-sys-color-surface-variant": hexFromArgb(light.surfaceVariant),
        "--md-sys-color-on-surface-variant": hexFromArgb(light.onSurfaceVariant),
        "--md-sys-color-outline": hexFromArgb(light.outline),
        "--md-sys-color-outline-variant": hexFromArgb(light.outlineVariant),
        "--md-sys-color-surface-container-low": hexFromArgb(light.surfaceContainerLow),
        "--md-sys-color-surface-container": hexFromArgb(light.surfaceContainer),
        "--md-sys-color-surface-container-high": hexFromArgb(light.surfaceContainerHigh),
        "--md-sys-color-surface-container-highest": hexFromArgb(light.surfaceContainerHighest),
        "--md-sys-color-inverse-surface": hexFromArgb(light.inverseSurface),
        "--md-sys-color-inverse-on-surface": hexFromArgb(light.inverseOnSurface)
      };

      Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    } catch (err) {
      console.warn("Theme initialization skipped:", err);
    }
  }

  applyTheme();

  // ==================== DOM HELPERS ====================
  const $ = id => document.getElementById(id);

  const viewMap = {
    bootLoading: $("bootLoadingView"),
    request: $("requestView"),
    process: $("processView"),
    initial: $("initialView"),
    equipmentAction: $("equipmentActionView"),
    addSeal: $("addSealView"),
    unregistered: $("unregisteredView"),
    inProgress: $("inProgressView"), // retained for legacy HTML compatibility; V2 does not whole-equipment block
    unauthorized: $("unauthorizedView"),
    alreadyProcessed: $("alreadyProcessedView"),
    initialSuccess: $("initialSuccessView"),
    addSealSuccess: $("addSealSuccessView"),
    requestSuccess: $("requestSuccessView"),
    finalizeSuccess: $("finalizeSuccessView"),
    queue: $("queueView")
  };

  const mainTabs = $("mainTabs");
  const tabRequest = $("tabRequest");
  const tabProcess = $("tabProcess");
  const tabInitial = $("tabInitial");
  const userChip = $("userChip");
  const snackbar = $("snackbar");

  // Request
  const sealChips = $("sealChips");
  const reqEquipment = $("reqEquipment");
  const reqEmail = $("reqEmail");
  const requestSubtitle = $("requestSubtitle");
  const reqReason = $("reqReason");
  const reqName = $("reqName");
  const reqCompany = $("reqCompany");
  const reqPhone = $("reqPhone");
  const submitBtn = $("submitBtn");
  const clearBtn = $("clearBtn");
  const requestRef = $("requestRef");
  const requestAnotherBtn = $("requestAnotherBtn");

  // Processor
  const processSubtitle = $("processSubtitle");
  const processDebug = $("processDebug");
  const processStatus = $("processStatus");
  const processSummary = $("processSummary");
  const processSeals = $("processSeals");
  const mappingList = $("mappingList");
  const removalDate = $("removalDate");
  const processRemarks = $("processRemarks");
  const mappingSection = $("mappingSection");
  const replacementDecisionHint = $("replacementDecisionHint");
  const finalizeBtn = $("finalizeBtn");
  const cancelBtn = $("cancelBtn");
  const alreadyProcessedSubtitle = $("alreadyProcessedSubtitle");

  // Initial registration
  const initEquipment = $("initEquipment");
  const initDateL2 = $("initDateL2");
  const initRemarks = $("initRemarks");
  const sealList = $("sealList");
  const addSealBtn = $("addSealBtn");
  const saveInitialBtn = $("saveInitialBtn");
  const initialSubtitle = $("initialSubtitle");
  const viewSealBtn = $("viewSealBtn");

  // Initial Seal registered-equipment action chooser
  const actionEquipmentSubtitle = $("actionEquipmentSubtitle");
  const actionCurrentSeals = $("actionCurrentSeals");
  const actionAddSealBtn = $("actionAddSealBtn");
  const actionRequestBreakBtn = $("actionRequestBreakBtn");

  // Add Seal(s)
  const addSealSubtitle = $("addSealSubtitle");
  const addSealEquipment = $("addSealEquipment");
  const addSealExistingSeals = $("addSealExistingSeals");
  const addSealList = $("addSealList");
  const addAnotherSealBtn = $("addAnotherSealBtn");
  const addSealDateInitials = $("addSealDateInitials");
  const addSealRemarks = $("addSealRemarks");
  const saveAddSealsBtn = $("saveAddSealsBtn");
  const backFromAddSealBtn = $("backFromAddSealBtn");
  const addSealSuccessMeta = $("addSealSuccessMeta");
  const addMoreSealBtn = $("addMoreSealBtn");

  // Unregistered
  const unregisteredSubtitle = $("unregisteredSubtitle");
  const unregisteredActions = $("unregisteredActions");
  const registerInitialBtn = $("registerInitialBtn");
  const contactOwnerBtn = $("contactOwnerBtn");
  const refreshUnregBtn = $("refreshUnregBtn");
  const backRequestBtn = $("backRequestBtn");
  const contactModal = $("contactModal");
  const closeContactBtn = $("closeContactBtn");
  const contactMailto = $("contactMailto");

  // Legacy pending view controls (no equipment-wide lock in V2)
  const scanAnotherBtn = $("scanAnotherBtn");

  // ==================== APP STATE ====================
  let currentContext = {
    email: "",
    role: "CONTRACTOR",
    roles: ["CONTRACTOR"],
    capabilities: {
      canRequest: true,
      canProcess: false,
      canInitialSeal: false,
      canAddSeal: false,
      canAdmin: false
    }
  };

  let currentEquipmentData = null;
  let currentEquipmentMode = ""; // "request" | "add" | ""
  let currentProcessRequest = null;
  let writeBusy = false;
  let listenersBound = false;

  // ==================== STARTUP VISIBILITY ====================
  Object.entries(viewMap).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle("hidden", key !== "bootLoading");
  });

  if (mainTabs) mainTabs.style.visibility = "hidden";

  [
    "backHomeBtnDup",
    "backHomeUnauthorizedBtn",
    "backHomeProcessedBtn",
    "backHomeBtn",
    "downloadSummaryBtn",
    "closeFinalizeBtn"
  ].forEach(id => {
    const el = $(id);
    if (el) {
      el.style.display = "none";
      el.disabled = true;
    }
  });

  // ==================== GENERAL UTILITIES ====================
  function getParam(key) {
    if (Object.prototype.hasOwnProperty.call(PAGE_PARAMS, key) && PAGE_PARAMS[key]) {
      return PAGE_PARAMS[key];
    }
    return urlParams.get(key) || "";
  }

  function setUrlParam(key, value) {
    try {
      const u = new URL(window.location.href);
      if (value) u.searchParams.set(key, value);
      else u.searchParams.delete(key);
      window.history.replaceState({}, "", u.toString());
      urlParams.set(key, value || "");
      if (!value) urlParams.delete(key);
    } catch (err) {
      console.warn("Could not update URL parameter", key, err);
    }
  }

  function truncateEmail(email) {
    const e = String(email || "");
    if (e.length <= 32) return e;
    const at = e.indexOf("@");
    if (at === -1) return e.slice(0, 28) + "…";
    const local = e.slice(0, at);
    const domain = e.slice(at + 1);
    const left = local.length > 18 ? local.slice(0, 16) + "…" : local;
    const dom = domain.length > 14 ? domain.slice(0, 12) + "…" : domain;
    return left + "@" + dom;
  }

  function showToast(message) {
    const text = String(message || "Something went wrong");
    console.log("[toast]", text);

    try {
      if (snackbar && "open" in snackbar) {
        snackbar.labelText = text;
        snackbar.open = true;
        return;
      }
    } catch (err) {
      console.warn("Snackbar failed:", err);
    }

    console.warn(text);
  }

  function errorMessage(err) {
    if (err && err.message) return String(err.message);
    return String(err || "Something went wrong");
  }

  function showFriendlyError(err) {
    const message = errorMessage(err);
    const lower = message.toLowerCase();

    if (lower.includes("access denied") || lower.includes("not authorized")) {
      showToast("Access denied. Please use an authorized company account.");
      return;
    }

    showToast(message);
  }

  function hasGoogleScriptRun() {
    return !!(
      window.google &&
      google.script &&
      google.script.run
    );
  }

function revealMainTabs() {
  if (!mainTabs) return;

  mainTabs.classList.remove("hidden");
  mainTabs.style.visibility = "";
}
  function setBusy(button, busy, busyLabel) {
    if (!button) return;

    if (busy) {
      button.disabled = true;
      button.dataset.busy = "true";
      const label = button.querySelector(".label");
      if (label && busyLabel) {
        if (!button.dataset.originalLabel) button.dataset.originalLabel = label.textContent || "";
        label.textContent = busyLabel;
      }
    } else {
      button.dataset.busy = "false";
      const label = button.querySelector(".label");
      if (label && button.dataset.originalLabel) {
        label.textContent = button.dataset.originalLabel;
        delete button.dataset.originalLabel;
      }
    }
  }

  function beginWrite(button, busyLabel) {
    if (writeBusy || (button && button.dataset.busy === "true")) return false;
    writeBusy = true;
    setBusy(button, true, busyLabel);
    return true;
  }

  function endWrite(button) {
    writeBusy = false;
    setBusy(button, false);
    updateFinalizeButtonState();
    updateRequestSubmitState();
  }

  function setTextFieldValue(field, value, disabled) {
    if (!field) return;
    const apply = () => {
      field.value = value || "";
      field.setAttribute("value", value || "");
      if (typeof disabled === "boolean") {
        field.disabled = disabled;
        field.readOnly = disabled;
      }
    };

    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined(field.tagName.toLowerCase()).then(apply).catch(apply);
    } else {
      apply();
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => String(v || "").trim()).filter(Boolean);
    const text = String(value || "").trim();
    if (!text) return [];
    if (text.startsWith("[") && text.endsWith("]")) {
      try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed)
          ? parsed.map(v => String(v || "").trim()).filter(Boolean)
          : [];
      } catch (err) {
        return [];
      }
    }
    return text.split(",").map(v => v.trim()).filter(Boolean);
  }

  function normalizeContext(ctx) {
    const raw = ctx || {};
    const roles = Array.isArray(raw.roles) && raw.roles.length
      ? raw.roles.map(r => String(r || "").trim().toUpperCase()).filter(Boolean)
      : [String(raw.role || "CONTRACTOR").trim().toUpperCase() || "CONTRACTOR"];

    const isAdmin = roles.includes("ADMIN");
    const isProcessor = roles.includes("PROCESSOR");
    const isInitial = roles.includes("INITIAL_SEAL");

    const serverCaps = raw.capabilities || {};
    return {
      email: String(raw.email || ""),
      role: String(raw.role || roles[0] || "CONTRACTOR").toUpperCase(),
      roles,
      capabilities: {
        canRequest: serverCaps.canRequest !== false,
        canProcess: typeof serverCaps.canProcess === "boolean" ? serverCaps.canProcess : (isAdmin || isProcessor),
        canInitialSeal: typeof serverCaps.canInitialSeal === "boolean" ? serverCaps.canInitialSeal : (isAdmin || isInitial),
        canAddSeal: typeof serverCaps.canAddSeal === "boolean" ? serverCaps.canAddSeal : (isAdmin || isInitial),
        canAdmin: typeof serverCaps.canAdmin === "boolean" ? serverCaps.canAdmin : isAdmin
      }
    };
  }

  // ==================== SERVER CALL WRAPPERS ====================
  function getUserContextServer() {
    return new Promise((resolve, reject) => {
      if (!hasGoogleScriptRun()) return reject(new Error("google.script.run unavailable."));
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getUserContext();
    });
  }

  function getEquipmentDataServer(equipmentId) {
    return new Promise((resolve, reject) => {
      if (!hasGoogleScriptRun()) return reject(new Error("google.script.run unavailable."));

      // JSON wrapper remains available for compatibility with Apps Script serialization.
      try {
        google.script.run
          .withSuccessHandler(jsonStr => {
            try {
              const parsed = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
              if (parsed && parsed._error) return reject(new Error(parsed._error));
              resolve(parsed);
            } catch (err) {
              reject(err);
            }
          })
          .withFailureHandler(() => {
            google.script.run
              .withSuccessHandler(resolve)
              .withFailureHandler(reject)
              .getEquipmentData(equipmentId);
          })
          .getEquipmentDataJson(equipmentId);
      } catch (err) {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .getEquipmentData(equipmentId);
      }
    });
  }

  function submitRequestServer(payload) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .submitRequest(payload);
    });
  }

  function initialSealSaveServer(payload) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .initialSealSave(payload);
    });
  }

  function addSealsServer(payload) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .addSealsToEquipment(payload);
    });
  }

  function getProcessPageDataServer(requestId) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getProcessPageData(requestId);
    });
  }

  function finalizeRequestServer(payload) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .finalizeRequest(payload);
    });
  }

  function cancelRequestServer(payload) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .cancelRequest(payload);
    });
  }

  function getProcessorQueueServer() {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .getProcessorQueueJson();
    });
  }

  // ==================== VIEW / CHROME ====================
  function enterQueueChrome() {
    document.body.classList.add("queue-page-bg");
    const shell = document.querySelector(".app-shell");
    if (shell) shell.classList.add("queue-mode");
    const mc = $("mainContainer");
    if (mc) mc.classList.add("queue-wide");
    const title = $("brandTitle");
    if (title) title.textContent = "Request Queue Lists";
    const topRefresh = $("queueTopRefreshBtn");
    if (topRefresh) topRefresh.classList.remove("hidden");
  }

  function exitQueueChrome() {
    document.body.classList.remove("queue-page-bg");
    const shell = document.querySelector(".app-shell");
    if (shell) shell.classList.remove("queue-mode");
    const mc = $("mainContainer");
    if (mc) mc.classList.remove("queue-wide");
    const title = $("brandTitle");
    if (title) title.textContent = "Tamper Seal Log";
    const topRefresh = $("queueTopRefreshBtn");
    if (topRefresh) topRefresh.classList.add("hidden");
  }

  function setView(view) {
    if (view !== "queue") exitQueueChrome();

    Object.values(viewMap).forEach(el => {
      if (el) el.classList.add("hidden");
    });

    const target = viewMap[view] || viewMap.request || viewMap.bootLoading;
    if (target) target.classList.remove("hidden");

    if (mainTabs) {
      if (view === "queue") {
        mainTabs.style.display = "none";
      } else {
        mainTabs.style.display = "";
        if (["request", "requestSuccess", "equipmentAction", "addSeal", "addSealSuccess"].includes(view)) {
          mainTabs.activeTabIndex = view === "addSeal" || view === "equipmentAction" || view === "addSealSuccess" ? 2 : 0;
        }
        if (["process", "finalizeSuccess", "alreadyProcessed"].includes(view)) mainTabs.activeTabIndex = 1;
        if (["initial", "initialSuccess", "unregistered"].includes(view)) mainTabs.activeTabIndex = 2;
      }
    }

    if (view === "queue") enterQueueChrome();
  }

  function setTabDisabled(tab, disabled) {
    if (!tab) return;
    tab.classList.toggle("tab-disabled", !!disabled);
    tab.setAttribute("aria-disabled", disabled ? "true" : "false");
  }

  function configureTabs() {
    if (!mainTabs) return;
    const caps = currentContext.capabilities;

    if (tabRequest) tabRequest.style.display = caps.canRequest ? "" : "none";
    if (tabProcess) tabProcess.style.display = caps.canProcess ? "" : "none";
    if (tabInitial) tabInitial.style.display = caps.canInitialSeal ? "" : "none";

    setTabDisabled(tabRequest, !caps.canRequest);
    setTabDisabled(tabProcess, !caps.canProcess);
    setTabDisabled(tabInitial, !caps.canInitialSeal);
  }

  function resolveWebAppBaseUrl() {
    const explicit = String(PAGE_PARAMS.webAppUrl || "").trim();
    if (explicit) return explicit.split("?")[0];

    const candidates = [];
    try { candidates.push(String(window.location.href || "")); } catch (err) { /* ignore */ }
    try { candidates.push(String(document.referrer || "")); } catch (err) { /* ignore */ }

    for (const raw of candidates) {
      if (!raw) continue;
      try {
        const u = new URL(raw);
        const match = u.pathname.match(/^(.*\/macros\/s\/[^/]+\/exec)$/);
        if (match) return u.origin + match[1];
      } catch (err) { /* ignore */ }
    }
    return "";
  }

  function navigateTo(page, extra) {
    const base = resolveWebAppBaseUrl();
    if (!base) {
      showToast("Unable to resolve web app URL.");
      return;
    }

    const params = new URLSearchParams();
    if (page) params.set("page", page);

    const eq = extra && Object.prototype.hasOwnProperty.call(extra, "eq")
      ? extra.eq
      : getParam("eq");
    if (eq) params.set("eq", eq);

    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (key === "eq") return;
        if (value !== undefined && value !== null && String(value) !== "") {
          params.set(key, String(value));
        }
      });
    }

    window.top.location.href = base + "?" + params.toString();
  }

  // ==================== USER / EQUIPMENT FIELD HELPERS ====================
  function lockEquipmentFields(equipmentId) {
    const id = String(equipmentId || "");
    if (!id) return;
    setTextFieldValue(reqEquipment, id, true);
    setTextFieldValue(initEquipment, id, true);
    setTextFieldValue(addSealEquipment, id, true);
  }

  function setRequesterEmail(email) {
    setTextFieldValue(reqEmail, email || "", true);
  }

  function updateEquipmentSubtitles(data) {
    if (!data) return;
    const id = data.equipmentId || getParam("eq");
    const dateText = data.dateL2 ? " • L2: " + data.dateL2 : "";
    if (requestSubtitle) requestSubtitle.textContent = "Equipment: " + id + dateText;
    if (initialSubtitle) initialSubtitle.textContent = "Equipment: " + id;
    if (unregisteredSubtitle) unregisteredSubtitle.textContent = "Equipment: " + id;
    if (actionEquipmentSubtitle) actionEquipmentSubtitle.textContent = "Equipment: " + id + dateText;
    if (addSealSubtitle) addSealSubtitle.textContent = "Equipment: " + id;
  }

  // ==================== SEAL RENDERING ====================
  function getPendingInfo(data, sealId) {
    if (!data || !data.pendingSealMap) return null;
    return data.pendingSealMap[sealId] || null;
  }

  function renderStaticSealList(container, seals, data) {
    if (!container) return;
    container.innerHTML = "";

    if (!seals || !seals.length) {
      const empty = document.createElement("div");
      empty.className = "supporting";
      empty.textContent = "No active seals registered.";
      container.appendChild(empty);
      return;
    }

    seals.forEach(sealId => {
      const pending = getPendingInfo(data, sealId);
      const item = document.createElement("div");
      item.className = "seal-status-row" + (pending ? " seal-status-row--pending" : "");

      const seal = document.createElement("span");
      seal.className = "seal-status-id";
      seal.textContent = sealId;

      const status = document.createElement("span");
      status.className = pending ? "seal-state seal-state--pending" : "seal-state seal-state--active";
      status.textContent = pending
        ? "Pending • " + (pending.requestId || "open request")
        : "Active";

      item.appendChild(seal);
      item.appendChild(status);
      container.appendChild(item);
    });
  }

  function renderSealChoices(data) {
    if (!sealChips) return;
    sealChips.innerHTML = "";

    const seals = Array.isArray(data && data.currentSeals) ? data.currentSeals : [];

    if (!seals.length) {
      const empty = document.createElement("div");
      empty.className = "supporting";
      empty.textContent = "No active seals are currently registered for this equipment.";
      sealChips.appendChild(empty);
      updateRequestSubmitState();
      return;
    }

    seals.forEach(sealId => {
      const pending = getPendingInfo(data, sealId);
      const wrapper = document.createElement("div");
      wrapper.className = "seal-option-wrap" + (pending ? " seal-option-wrap--pending" : "");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "seal-option" + (pending ? " seal-option--pending" : " seal-option--available");
      button.dataset.sealId = sealId;
      button.setAttribute("aria-pressed", "false");

      const idSpan = document.createElement("span");
      idSpan.className = "seal-option-id";
      idSpan.textContent = sealId;
      button.appendChild(idSpan);

      const stateSpan = document.createElement("span");
      stateSpan.className = "seal-option-state";

      if (pending) {
        button.disabled = true;
        button.setAttribute("aria-disabled", "true");
        stateSpan.textContent = "Pending • " + (pending.requestId || "open request");
      } else {
        stateSpan.textContent = "Available";
        button.addEventListener("click", () => {
          const selected = button.getAttribute("aria-pressed") === "true";
          button.setAttribute("aria-pressed", selected ? "false" : "true");
          button.classList.toggle("seal-option--selected", !selected);
          updateRequestSubmitState();
        });
      }

      button.appendChild(stateSpan);
      wrapper.appendChild(button);
      sealChips.appendChild(wrapper);
    });

    updateRequestSubmitState();
  }

  function getSelectedSeals() {
    if (!sealChips) return [];
    return Array.from(sealChips.querySelectorAll(".seal-option[aria-pressed='true']"))
      .map(el => String(el.dataset.sealId || "").trim())
      .filter(Boolean);
  }

  function clearSelectedSeals() {
    if (!sealChips) return;
    sealChips.querySelectorAll(".seal-option[aria-pressed='true']").forEach(el => {
      el.setAttribute("aria-pressed", "false");
      el.classList.remove("seal-option--selected");
    });
    updateRequestSubmitState();
  }

  function updateRequestSubmitState() {
    if (!submitBtn) return;

    if (writeBusy) {
      submitBtn.disabled = true;
      return;
    }

    const data = currentEquipmentData;
    const isRegistered = !!(data && data.isRegistered);
    const selected = getSelectedSeals();
    const fieldsComplete = !!(
      reqReason && String(reqReason.value || "").trim() &&
      reqName && String(reqName.value || "").trim() &&
      reqCompany && String(reqCompany.value || "").trim() &&
      reqPhone && String(reqPhone.value || "").trim()
    );

    submitBtn.disabled = !(isRegistered && selected.length && fieldsComplete);
  }

  // ==================== INITIAL / ADD-SEAL INPUT ROWS ====================
  function addSealInputRow(container, value, className) {
    if (!container) return;

    const row = document.createElement("div");
    row.className = "seal-row";

    const field = document.createElement("md-outlined-text-field");
    field.className = className;
    field.setAttribute("label", "Seal ID");
    field.setAttribute("supporting-text", "Required");
    field.value = value || "";
    if (value) field.setAttribute("value", value);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "icon-btn seal-remove";
    remove.setAttribute("aria-label", "Remove seal");
    remove.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">delete</span><span class="tooltip">Remove</span>';

    remove.addEventListener("click", () => {
      const rows = container.querySelectorAll(".seal-row");
      if (rows.length <= 1) return;
      row.remove();
      updateRemoveButtonState(container);
    });

    row.appendChild(field);
    row.appendChild(remove);
    container.appendChild(row);
    updateRemoveButtonState(container);
  }

  function updateRemoveButtonState(container) {
    if (!container) return;
    const rows = container.querySelectorAll(".seal-row");
    rows.forEach(row => {
      const btn = row.querySelector(".seal-remove");
      if (btn) btn.disabled = rows.length <= 1;
    });
  }

  function collectSealIds(container, inputClass) {
    if (!container) return { values: [], duplicates: [] };

    const fields = Array.from(container.querySelectorAll("." + inputClass));
    const values = fields
      .map(input => String(input.value || "").trim())
      .filter(Boolean);

    const seen = new Set();
    const duplicates = [];
    values.forEach(value => {
      if (seen.has(value) && !duplicates.includes(value)) duplicates.push(value);
      seen.add(value);
    });

    fields.forEach(input => {
      const value = String(input.value || "").trim();
      if (value && duplicates.includes(value)) {
        input.setAttribute("error", "");
        input.setAttribute("supporting-text", "Duplicate seal ID");
      } else {
        input.removeAttribute("error");
        input.setAttribute("supporting-text", "Required");
      }
    });

    return { values, duplicates };
  }

  function resetInitialSealForm() {
    if (sealList) {
      sealList.innerHTML = "";
      addSealInputRow(sealList, "", "seal-input");
    }
    if (initDateL2) initDateL2.value = "";
    if (initRemarks) initRemarks.value = "";
  }

  function resetAddSealForm() {
    if (addSealList) {
      addSealList.innerHTML = "";
      addSealInputRow(addSealList, "", "add-seal-input");
    }
    if (addSealDateInitials) addSealDateInitials.value = "";
    if (addSealRemarks) addSealRemarks.value = "";
  }

  // ==================== INITIAL-SEAL ACTION CHOOSER ====================
  function showEquipmentActionChooser(data) {
    currentEquipmentMode = "";
    setUrlParam("mode", "");
    updateEquipmentSubtitles(data);
    renderStaticSealList(actionCurrentSeals, data.currentSeals || [], data);
    setView("equipmentAction");
  }

  function enterRequestMode(data) {
    currentEquipmentMode = "request";
    setUrlParam("mode", "break");
    updateEquipmentSubtitles(data);
    renderSealChoices(data);
    setView("request");
  }

  function enterAddSealMode(data) {
    if (!currentContext.capabilities.canAddSeal) {
      setView("unauthorized");
      return;
    }

    currentEquipmentMode = "add";
    setUrlParam("mode", "add");
    updateEquipmentSubtitles(data);
    renderStaticSealList(addSealExistingSeals, data.currentSeals || [], data);
    resetAddSealForm();
    setView("addSeal");
  }

 // ==================== PROCESSOR PARTIAL SEAL PROCESSING ====================

function parseSealProgressClient_(value, selectedSeals) {
  let progress = {};

  if (value && typeof value === "object") {
    progress = value;
  } else {
    const text = String(value || "").trim();

    if (text) {
      try {
        progress = JSON.parse(text);
      } catch (err) {
        progress = {};
      }
    }
  }

  const result = {};

  (selectedSeals || []).forEach(sealId => {
    const key = String(sealId || "").trim();
    if (!key) return;

    const existing =
      progress[key] ||
      progress[key.toUpperCase()] ||
      {};

    result[key] = {
      status: String(existing.status || "PENDING")
        .trim()
        .toUpperCase(),

      newSealApplied:
        String(existing.newSealApplied || ""),

      newSealId:
        String(existing.newSealId || ""),

      removalDate:
        String(existing.removalDate || ""),

      dateInitials:
        String(existing.dateInitials || ""),

      remarks:
        String(existing.remarks || ""),

      actionedBy:
        String(existing.actionedBy || ""),

      actionedAt:
        String(existing.actionedAt || "")
    };
  });

  return result;
}


function getPendingProcessRows_() {
  if (!mappingList) return [];

  return Array.from(
    mappingList.querySelectorAll(
      ".partial-seal-row[data-status='pending']"
    )
  );
}


function setPerSealDecision_(row, decision) {
  if (!row) return;

  const yesBtn =
    row.querySelector(".partial-replace-yes");

  const noBtn =
    row.querySelector(".partial-replace-no");

  const newSealField =
    row.querySelector(".partial-new-seal");

  const initialsField =
    row.querySelector(".partial-date-initials");

  if (yesBtn) {
    yesBtn.setAttribute(
      "aria-pressed",
      decision === "Yes" ? "true" : "false"
    );
  }

  if (noBtn) {
    noBtn.setAttribute(
      "aria-pressed",
      decision === "No" ? "true" : "false"
    );
  }

  const showReplacement =
    decision === "Yes";

  if (newSealField) {
    newSealField.classList.toggle(
      "hidden",
      !showReplacement
    );

    newSealField.disabled =
      !showReplacement;

    if (!showReplacement) {
      newSealField.value = "";
    }
  }

  if (initialsField) {
    initialsField.classList.toggle(
      "hidden",
      !showReplacement
    );

    initialsField.disabled =
      !showReplacement;

    if (!showReplacement) {
      initialsField.value = "";
    }
  }

  updateFinalizeButtonState();
}


function setPerSealEnabled_(row, enabled) {
  if (!row) return;

  const controls =
    row.querySelector(
      ".partial-seal-controls"
    );

  if (controls) {
    controls.classList.toggle(
      "hidden",
      !enabled
    );
  }

  row.classList.toggle(
    "partial-seal-row--selected",
    !!enabled
  );

  if (!enabled) {

    row.querySelectorAll(
      ".partial-replace-btn"
    ).forEach(btn => {
      btn.setAttribute(
        "aria-pressed",
        "false"
      );
    });

    const newSealField =
      row.querySelector(
        ".partial-new-seal"
      );

    const initialsField =
      row.querySelector(
        ".partial-date-initials"
      );

    if (newSealField) {
      newSealField.value = "";
      newSealField.disabled = true;
      newSealField.classList.add("hidden");
    }

    if (initialsField) {
      initialsField.value = "";
      initialsField.disabled = true;
      initialsField.classList.add("hidden");
    }
  }

  updateFinalizeButtonState();
}


function collectSealActions_() {
  const actions = [];

  getPendingProcessRows_()
    .forEach(row => {

      const checkbox =
        row.querySelector(
          ".process-now-check"
        );

      if (
        !checkbox ||
        !checkbox.checked
      ) {
        return;
      }

      const oldSeal =
        String(
          row.dataset.sealId || ""
        ).trim();

      const selectedDecision =
        row.querySelector(
          ".partial-replace-btn[aria-pressed='true']"
        );

      const decision =
        selectedDecision
          ? String(
              selectedDecision.dataset.decision ||
              ""
            )
          : "";

      const newSealField =
        row.querySelector(
          ".partial-new-seal"
        );

      const initialsField =
        row.querySelector(
          ".partial-date-initials"
        );

      actions.push({
        oldSeal,

        newSealApplied:
          decision,

        newSealId:
          decision === "Yes" &&
          newSealField
            ? String(
                newSealField.value || ""
              ).trim()
            : "",

        dateInitials:
          decision === "Yes" &&
          initialsField
            ? String(
                initialsField.value || ""
              ).trim()
            : ""
      });
    });

  return actions;
}


function processorFormState() {
  const actions =
    collectSealActions_();

  const removalDateValue =
    removalDate
      ? String(
          removalDate.value || ""
        ).trim()
      : "";

  const remarksValue =
    processRemarks
      ? String(
          processRemarks.value || ""
        ).trim()
      : "";

  if (!actions.length) {
    return {
      valid: false,
      reason: "NO_SELECTION",
      actions
    };
  }

  if (
    !removalDateValue ||
    !remarksValue
  ) {
    return {
      valid: false,
      reason: "MISSING_BATCH_FIELDS",
      actions
    };
  }

  for (const action of actions) {

    if (!action.newSealApplied) {
      return {
        valid: false,
        reason: "MISSING_DECISION",
        seal: action.oldSeal,
        actions
      };
    }

    if (
      action.newSealApplied === "Yes"
    ) {

      if (!action.newSealId) {
        return {
          valid: false,
          reason: "MISSING_NEW_SEAL",
          seal: action.oldSeal,
          actions
        };
      }

      if (!action.dateInitials) {
        return {
          valid: false,
          reason: "MISSING_INITIALS",
          seal: action.oldSeal,
          actions
        };
      }
    }
  }

  const replacementIds =
    actions
      .filter(
        action =>
          action.newSealApplied === "Yes"
      )
      .map(
        action =>
          action.newSealId.toUpperCase()
      );

  if (
    new Set(replacementIds).size !==
    replacementIds.length
  ) {
    return {
      valid: false,
      reason: "DUPLICATE_REPLACEMENT",
      actions
    };
  }

  return {
    valid: true,
    reason: "",
    actions,
    removalDate: removalDateValue,
    remarks: remarksValue
  };
}


function updateFinalizeButtonState() {
  if (!finalizeBtn) return;

  if (
    writeBusy ||
    finalizeBtn.dataset.busy === "true"
  ) {
    finalizeBtn.disabled = true;
    return;
  }

  finalizeBtn.disabled =
    !processorFormState().valid;
}


function renderProcessSummary(req) {
  currentProcessRequest = req;

  const requestId =
    String(
      req.RequestId ||
      req.requestId ||
      getParam("rid") ||
      ""
    );

  if (processSubtitle) {
    processSubtitle.textContent =
      "Request ID: " + requestId;
  }

  const selected =
    Array.isArray(req.selectedSeals) &&
    req.selectedSeals.length
      ? req.selectedSeals
      : parseList(
          req.SelectedOldSeals
        );

  const progress =
    parseSealProgressClient_(
      req.SealProgress,
      selected
    );

  const completedCount =
    selected.filter(seal => {
      const item = progress[seal];

      return (
        item &&
        item.status === "COMPLETED"
      );
    }).length;

  const remainingCount =
    selected.length - completedCount;

  const status =
    String(
      req.Status ||
      req.status ||
      "PENDING"
    )
      .trim()
      .toUpperCase();

  if (processStatus) {
    processStatus.innerHTML = "";

    const statusChip =
      document.createElement(
        "md-assist-chip"
      );

    statusChip.className =
      "status-chip";

    statusChip.setAttribute(
      "label",
      status || "PENDING"
    );

    processStatus.appendChild(
      statusChip
    );

    const progressChip =
      document.createElement(
        "md-assist-chip"
      );

    progressChip.className =
      "status-chip";

    progressChip.setAttribute(
      "label",
      completedCount +
        "/" +
        selected.length +
        " completed"
    );

    processStatus.appendChild(
      progressChip
    );
  }

  if (processSummary) {
    processSummary.innerHTML = "";

    const name =
      String(req.Name || "");

    const company =
      String(req.Company || "");

    const fields = [
      [
        "Equipment ID",
        req.EquipmentId || ""
      ],

      [
        "Requester",
        name +
        (
          company
            ? " (" + company + ")"
            : ""
        )
      ],

      [
        "Phone",
        req.Phone || ""
      ],

      [
        "Reason",
        req.Reason || ""
      ],

      [
        "Requester Email",
        req.RequesterEmail || ""
      ],

      [
        "Remaining",
        remainingCount +
          " seal(s)"
      ]
    ];

    fields.forEach(
      ([label, value]) => {

        const item =
          document.createElement("div");

        item.className =
          "kv-item";

        const key =
          document.createElement("div");

        key.className =
          "kv-label";

        key.textContent =
          label;

        const val =
          document.createElement("div");

        val.className =
          "kv-value";

        val.textContent =
          value || "";

        item.appendChild(key);
        item.appendChild(val);

        processSummary.appendChild(
          item
        );
      }
    );
  }

  if (processSeals) {
    processSeals.innerHTML = "";

    selected.forEach(seal => {

      const item =
        progress[seal] || {
          status: "PENDING"
        };

      const chip =
        document.createElement(
          "md-assist-chip"
        );

      chip.setAttribute(
        "label",
        seal +
        (
          item.status === "COMPLETED"
            ? " • Completed"
            : " • Pending"
        )
      );

      processSeals.appendChild(
        chip
      );
    });
  }



  if (replacementDecisionHint) {
    replacementDecisionHint.textContent =
      "Tick the seal(s) you are processing now. Unselected seals remain pending.";
  }

  if (mappingSection) {
    mappingSection.classList.remove(
      "hidden"
    );

    mappingSection.classList.remove(
      "fade-slide"
    );

    mappingSection.classList.add(
      "active"
    );
  }

  if (mappingList) {
    mappingList.innerHTML = "";

    selected.forEach(seal => {

      const item =
        progress[seal] || {
          status: "PENDING"
        };

      const completed =
        item.status === "COMPLETED";

      const row =
        document.createElement("div");

      row.className =
        "partial-seal-row" +
        (
          completed
            ? " partial-seal-row--completed"
            : ""
        );

      row.dataset.sealId =
        seal;

      row.dataset.status =
        completed
          ? "completed"
          : "pending";

      // Already completed seal
      if (completed) {

        const statusLine =
          document.createElement("div");

        statusLine.className =
          "partial-seal-completed";

        const title =
          document.createElement(
            "strong"
          );

        title.textContent =
          "✓ " + seal;

        const detail =
          document.createElement(
            "span"
          );

        const replacementText =
          String(
            item.newSealApplied || ""
          ) === "Yes" &&
          item.newSealId
            ? " → " +
              item.newSealId
            : " → No replacement";

detail.textContent =
  replacementText +
  (
    item.removalDate
      ? " • " + item.removalDate
      : ""
  ) +
  (
    item.actionedBy
      ? " • " + item.actionedBy
      : ""
  );

        statusLine.appendChild(
          title
        );

        statusLine.appendChild(
          detail
        );

        row.appendChild(
          statusLine
        );

        mappingList.appendChild(
          row
        );

        return;
      }

      // Pending seal
      const top =
        document.createElement("div");

      top.className =
        "partial-seal-top";

      const checkLabel =
        document.createElement(
          "label"
        );

      checkLabel.className =
        "partial-process-check-label";

      const checkbox =
        document.createElement(
          "input"
        );

      checkbox.type =
        "checkbox";

      checkbox.className =
        "process-now-check";

      const sealText =
        document.createElement(
          "strong"
        );

      sealText.textContent =
        seal;

      const pendingText =
        document.createElement(
          "span"
        );

      pendingText.className =
        "partial-pending-label";

      pendingText.textContent =
        "Pending";

      checkLabel.appendChild(
        checkbox
      );

      checkLabel.appendChild(
        sealText
      );

      top.appendChild(
        checkLabel
      );

      top.appendChild(
        pendingText
      );

      const controls =
        document.createElement(
          "div"
        );

      controls.className =
        "partial-seal-controls hidden";

      const question =
        document.createElement(
          "div"
        );

      question.className =
        "supporting";

      question.textContent =
        "New tamper seal applied?";

      const segmented =
        document.createElement(
          "div"
        );

      segmented.className =
        "segmented partial-seal-segmented";

      const yesBtn =
        document.createElement(
          "button"
        );

      yesBtn.type =
        "button";

      yesBtn.className =
        "segmented-btn partial-replace-btn partial-replace-yes";

      yesBtn.dataset.decision =
        "Yes";

      yesBtn.setAttribute(
        "aria-pressed",
        "false"
      );

      yesBtn.textContent =
        "Yes";

      const noBtn =
        document.createElement(
          "button"
        );

      noBtn.type =
        "button";

      noBtn.className =
        "segmented-btn partial-replace-btn partial-replace-no";

      noBtn.dataset.decision =
        "No";

      noBtn.setAttribute(
        "aria-pressed",
        "false"
      );

      noBtn.textContent =
        "No";

      segmented.appendChild(
        yesBtn
      );

      segmented.appendChild(
        noBtn
      );

      const newSealField =
        document.createElement(
          "input"
        );

      newSealField.type =
        "text";

      newSealField.className =
        "mapping-field partial-new-seal hidden";

      newSealField.placeholder =
        "Enter new seal ID";

      newSealField.autocomplete =
        "off";

      newSealField.disabled =
        true;

      const initialsField =
        document.createElement(
          "input"
        );

      initialsField.type =
        "text";

      initialsField.className =
        "mapping-field partial-date-initials hidden";

      initialsField.placeholder =
        "Date / Initials";

      initialsField.autocomplete =
        "off";

      initialsField.disabled =
        true;

      controls.appendChild(
        question
      );

      controls.appendChild(
        segmented
      );

      controls.appendChild(
        newSealField
      );

      controls.appendChild(
        initialsField
      );

      checkbox.addEventListener(
        "change",
        () => {
          setPerSealEnabled_(
            row,
            checkbox.checked
          );
        }
      );

      yesBtn.addEventListener(
        "click",
        () => {
          setPerSealDecision_(
            row,
            "Yes"
          );
        }
      );

      noBtn.addEventListener(
        "click",
        () => {
          setPerSealDecision_(
            row,
            "No"
          );
        }
      );

      newSealField.addEventListener(
        "input",
        updateFinalizeButtonState
      );

      initialsField.addEventListener(
        "input",
        updateFinalizeButtonState
      );

      row.appendChild(top);
      row.appendChild(controls);

      mappingList.appendChild(
        row
      );
    });
  }

  if (removalDate) {
    removalDate.value = "";
  }

  if (processRemarks) {
    processRemarks.value = "";
  }

  updateFinalizeButtonState();
}


function showProcessEmpty(
  message,
  requestId
) {

  if (processSubtitle) {
    processSubtitle.textContent =
      (
        message ||
        "Request details unavailable."
      ) +
      (
        requestId
          ? " (" +
            requestId +
            ")"
          : ""
      );
  }

  if (processStatus) {
    processStatus.innerHTML = "";
  }

  if (processSummary) {
    processSummary.innerHTML = "";
  }

  if (processSeals) {
    processSeals.innerHTML = "";
  }

  if (mappingList) {
    mappingList.innerHTML = "";
  }
}
  
  // ==================== LOAD EQUIPMENT ====================
  async function loadEquipment(options) {
    const eq = String((options && options.equipmentId) || getParam("eq") || "").trim();
    if (!eq) {
      setView("request");
      if (requestSubtitle) requestSubtitle.textContent = "No equipment ID was supplied in the QR link.";
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    lockEquipmentFields(eq);
    if (unregisteredSubtitle) unregisteredSubtitle.textContent = "Equipment: " + eq;

    setView("bootLoading");
    const bootSub = $("bootLoadingSubtitle");
    if (bootSub) bootSub.textContent = "Loading current seal status…";

    try {
      const data = await getEquipmentDataServer(eq);
      if (!data) throw new Error("No equipment data returned.");

      currentEquipmentData = data;
      lockEquipmentFields(data.equipmentId || eq);
      updateEquipmentSubtitles(data);

      const isRegistered = typeof data.isRegistered === "boolean"
        ? data.isRegistered
        : !!data.hasInitialSeal;

      if (!isRegistered) {
        if (submitBtn) submitBtn.disabled = true;

        if (registerInitialBtn) {
          registerInitialBtn.style.display = currentContext.capabilities.canInitialSeal ? "" : "none";
        }
        if (contactOwnerBtn) {
          contactOwnerBtn.style.display = currentContext.capabilities.canInitialSeal ? "none" : "";
        }
        if (refreshUnregBtn) refreshUnregBtn.style.display = "";
        if (backRequestBtn) backRequestBtn.style.display = "none";

        setView("unregistered");
        return;
      }

      const modeFromUrl = String(getParam("mode") || "").toLowerCase();

      // Initial Seal / Admin users explicitly choose what they want to do
      // when scanning a registered equipment, unless a mode was already chosen.
      if (currentContext.capabilities.canInitialSeal) {
        if (modeFromUrl === "add" || currentEquipmentMode === "add") {
          enterAddSealMode(data);
          return;
        }
        if (modeFromUrl === "break" || modeFromUrl === "request" || currentEquipmentMode === "request") {
          enterRequestMode(data);
          return;
        }
        showEquipmentActionChooser(data);
        return;
      }

      enterRequestMode(data);
    } catch (err) {
      const message = errorMessage(err);
      const lower = message.toLowerCase();

      if (lower.includes("equipment id not found")) {
        currentEquipmentData = null;
        if (unregisteredSubtitle) unregisteredSubtitle.textContent = "Equipment: " + eq;
        if (registerInitialBtn) registerInitialBtn.style.display = "none";
        if (contactOwnerBtn) contactOwnerBtn.style.display = "";
        if (refreshUnregBtn) refreshUnregBtn.style.display = "";
        setView("unregistered");
      } else {
        setView("request");
        if (requestSubtitle) requestSubtitle.textContent = "Error: " + message;
        if (submitBtn) submitBtn.disabled = true;
        showFriendlyError(err);
      }
    }
  }

  // ==================== REQUEST ACTION ====================
  async function submitRequestAction() {
    if (!submitBtn || !beginWrite(submitBtn, "Submitting…")) return;

    try {
      const equipmentId = String((reqEquipment && reqEquipment.value) || getParam("eq") || "").trim();
      const selectedSeals = getSelectedSeals();

      if (!equipmentId) throw new Error("Equipment ID is missing.");
      if (!selectedSeals.length) throw new Error("Select at least one available seal.");

      const reason = String((reqReason && reqReason.value) || "").trim();
      const name = String((reqName && reqName.value) || "").trim();
      const company = String((reqCompany && reqCompany.value) || "").trim();
      const phone = String((reqPhone && reqPhone.value) || "").trim();

      if (!reason || !name || !company || !phone) {
        throw new Error("Fill all required fields.");
      }

      const result = await submitRequestServer({
        equipmentId,
        selectedSeals,
        reason,
        name,
        company,
        phone
      });

      if (requestRef) {
        requestRef.textContent = "Ref ID: " + (result && result.requestId ? result.requestId : "") + " recorded.";
      }

      setView("requestSuccess");
    } catch (err) {
      showFriendlyError(err);
      // Refresh server state after a conflict. This ensures seals requested by
      // another person while this page was open immediately become disabled.
      try { await loadEquipment(); } catch (refreshErr) { /* ignore */ }
    } finally {
      endWrite(submitBtn);
    }
  }

  function clearRequestForm() {
    if (reqReason) reqReason.value = "";
    if (reqName) reqName.value = "";
    if (reqCompany) reqCompany.value = "";
    if (reqPhone) reqPhone.value = "";
    clearSelectedSeals();
  }

  // ==================== INITIAL REGISTRATION ACTION ====================
  async function initialSealSaveAction() {
    if (!saveInitialBtn || !beginWrite(saveInitialBtn, "Saving…")) return;

    try {
      const { values, duplicates } = collectSealIds(sealList, "seal-input");
      if (!values.length) throw new Error("Enter at least one seal ID.");
      if (duplicates.length) throw new Error("Duplicate seal IDs detected: " + duplicates.join(", "));

      const equipmentId = String((initEquipment && initEquipment.value) || getParam("eq") || "").trim();
      const dateL2 = String((initDateL2 && initDateL2.value) || "").trim();
      const remarks = String((initRemarks && initRemarks.value) || "").trim();

      if (!equipmentId || !dateL2) throw new Error("Equipment ID and Date L2 Tag Signed are required.");

      await initialSealSaveServer({ equipmentId, dateL2, remarks, seals: values });
      setView("initialSuccess");
    } catch (err) {
      showFriendlyError(err);
    } finally {
      endWrite(saveInitialBtn);
    }
  }

  // ==================== ADD SEAL ACTION ====================
  async function addSealsAction() {
    if (!saveAddSealsBtn || !beginWrite(saveAddSealsBtn, "Adding…")) return;

    try {
      const { values, duplicates } = collectSealIds(addSealList, "add-seal-input");
      if (!values.length) throw new Error("Enter at least one new seal ID.");
      if (duplicates.length) throw new Error("Duplicate seal IDs detected: " + duplicates.join(", "));

      const equipmentId = String((addSealEquipment && addSealEquipment.value) || getParam("eq") || "").trim();
      if (!equipmentId) throw new Error("Equipment ID is missing.");

      const result = await addSealsServer({
        equipmentId,
        seals: values,
        dateInitials: String((addSealDateInitials && addSealDateInitials.value) || "").trim(),
        remarks: String((addSealRemarks && addSealRemarks.value) || "").trim()
      });

      if (addSealSuccessMeta) {
        addSealSuccessMeta.textContent = "Added: " + ((result && result.addedSeals) ? result.addedSeals.join(", ") : values.join(", "));
      }

      // Refresh cached equipment state so the action chooser / request page sees the new seals.
      currentEquipmentData = await getEquipmentDataServer(equipmentId);
      setView("addSealSuccess");
    } catch (err) {
      showFriendlyError(err);
    } finally {
      endWrite(saveAddSealsBtn);
    }
  }

  // ==================== PROCESS LOAD / ACTIONS ====================
async function loadRequest() {
  const requestId =
    String(
      getParam("rid") || ""
    ).trim();

  if (!requestId) {
    showProcessEmpty(
      "No request ID in URL.",
      ""
    );

    return;
  }

  setView("process");

  if (processSubtitle) {
    processSubtitle.textContent =
      "Loading request " +
      requestId +
      "…";
  }

  try {

    const data =
      await getProcessPageDataServer(
        requestId
      );

    const req =
      data && data.request
        ? data.request
        : data;

    if (
      !req ||
      req._error
    ) {

      showProcessEmpty(
        (
          req &&
          req._error
        ) ||
        "Request details unavailable.",
        requestId
      );

      return;
    }

    const status =
      String(
        req.Status ||
        req.status ||
        ""
      )
        .trim()
        .toUpperCase();

    // PARTIAL is still an open request.
    if (
      status &&
      status !== "PENDING" &&
      status !== "PARTIAL"
    ) {

      if (
        alreadyProcessedSubtitle
      ) {

        alreadyProcessedSubtitle.textContent =
          "Request ID: " +
          (
            req.RequestId ||
            requestId
          ) +
          " • Status: " +
          status;
      }

      setView(
        "alreadyProcessed"
      );

      return;
    }

    renderProcessSummary(req);

    setView("process");

  } catch (err) {

    showFriendlyError(err);

    showProcessEmpty(
      errorMessage(err),
      requestId
    );
  }
}


async function finalizeAction() {
  if (!finalizeBtn) return;

  const state =
    processorFormState();

  if (!state.valid) {

    if (
      state.reason ===
      "NO_SELECTION"
    ) {

      showToast(
        "Select at least one pending seal to process now."
      );

    } else if (
      state.reason ===
      "MISSING_BATCH_FIELDS"
    ) {

      showToast(
        "Date of removal and remarks are required."
      );

    } else if (
      state.reason ===
      "MISSING_DECISION"
    ) {

      showToast(
        "Select Yes or No for " +
        state.seal +
        "."
      );

    } else if (
      state.reason ===
      "MISSING_NEW_SEAL"
    ) {

      showToast(
        "Enter the replacement seal ID for " +
        state.seal +
        "."
      );

    } else if (
      state.reason ===
      "MISSING_INITIALS"
    ) {

      showToast(
        "Enter Date / Initials for the replacement of " +
        state.seal +
        "."
      );

    } else if (
      state.reason ===
      "DUPLICATE_REPLACEMENT"
    ) {

      showToast(
        "The same replacement seal ID cannot be used more than once."
      );

    } else {

      showToast(
        "Complete the selected seal processing details."
      );
    }

    return;
  }

  if (
    !beginWrite(
      finalizeBtn,
      "Processing…"
    )
  ) {
    return;
  }

  if (cancelBtn) {
    cancelBtn.disabled = true;
  }

  try {

    const result =
      await finalizeRequestServer({
        requestId:
          String(
            getParam("rid") || ""
          ).trim(),

        removalDate:
          state.removalDate,

        remarks:
          state.remarks,

        sealActions:
          state.actions
      });

    if (
      result &&
      result.alreadyFinalized
    ) {

      showToast(
        "This request was already finalized."
      );

      setView(
        "finalizeSuccess"
      );

      return;
    }

    if (
      result &&
      result.alreadyProcessed
    ) {

      showToast(
        "Those seal(s) were already processed. Reloading current status."
      );

      await loadRequest();

      return;
    }

    const status =
      String(
        result &&
        result.status ||
        ""
      ).toUpperCase();

    const counts =
      result &&
      result.progressCounts
        ? result.progressCounts
        : null;

    if (
      status === "PARTIAL"
    ) {

      const progressText =
        counts
          ? counts.completed +
            "/" +
            counts.total +
            " completed. " +
            counts.remaining +
            " remaining."
          : "Request partially processed.";

      showToast(
        progressText
      );

      // Stay on same Request ID.
      // Remaining seals can be processed later.
      await loadRequest();

      return;
    }

    if (
      status === "FINALIZED"
    ) {

      setView(
        "finalizeSuccess"
      );

      return;
    }

    showToast(
      "Processing saved. Current status: " +
      (
        status ||
        "UPDATED"
      )
    );

    await loadRequest();

  } catch (err) {

    showFriendlyError(err);

  } finally {

    endWrite(
      finalizeBtn
    );

    if (cancelBtn) {
      cancelBtn.disabled = false;
    }
  }
}

  async function cancelAction() {
    if (!cancelBtn) return;

    const remarks = String((processRemarks && processRemarks.value) || "").trim();
    if (!remarks) {
      showToast("Remarks are required to cancel a request.");
      return;
    }

    if (!beginWrite(cancelBtn, "Cancelling…")) return;
    if (finalizeBtn) finalizeBtn.disabled = true;

    try {
      const result = await cancelRequestServer({
        requestId: String(getParam("rid") || "").trim(),
        remarks
      });

      if (result && result.alreadyCancelled) {
        showToast("This request was already cancelled.");
      } else {
        showToast("Request cancelled.");
      }

      if (alreadyProcessedSubtitle) {
        alreadyProcessedSubtitle.textContent = "Request ID: " + String(getParam("rid") || "") + " • Status: CANCELLED";
      }
      setView("alreadyProcessed");
    } catch (err) {
      showFriendlyError(err);
    } finally {
      endWrite(cancelBtn);
      updateFinalizeButtonState();
    }
  }

  // ==================== PROCESSOR QUEUE ====================
  const QUEUE_PAGE_SIZE = 8;
  let queueListenersBound = false;
  const queueState = {
    bucket: "pending",
    search: "",
    page: 0,
    rows: { pending: [], finalized: [], cancelled: [] },
    counts: { pending: 0, finalized: 0, cancelled: 0 }
  };

  function queueFormatSubmitted(value) {
    const raw = String(value || "").trim();
    if (!raw) return "—";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;
    try {
      return dt.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    } catch (err) {
      return raw;
    }
  }

  function queueStatusBadgeClass(status) {
    const s = String(status || "").trim().toUpperCase();
    if (s === "FINALIZED") return "queue-badge--finalized";
    if (s === "CANCELLED" || s === "REJECTED") return "queue-badge--cancelled";
    return "queue-badge--pending";
  }

function queueStatusLabel(row) {
  const status =
    String(
      row && row.status || ""
    )
      .trim()
      .toUpperCase() ||
    "PENDING";

  const progress =
    String(
      row && row.progressText || ""
    ).trim();

  if (
    status === "PARTIAL" &&
    progress
  ) {
    return (
      "PARTIAL • " +
      progress
    );
  }

  return status;
}

  function queueRowMatchesSearch(row, query) {
    if (!query) return true;
const haystack = [
  row.requestId,
  row.equipmentId,
  row.reason,
  row.name,
  row.company,
  row.status,
  row.progressText
]
  .join(" ")
  .toLowerCase();
    return haystack.includes(query.toLowerCase());
  }

  function queueFilteredList() {
    const rows = queueState.rows[queueState.bucket] || [];
    return rows.filter(row => queueRowMatchesSearch(row, queueState.search.trim()));
  }

  function queueNavigateToProcess(row) {
    const base = resolveWebAppBaseUrl();
    const requestId = String(row && row.requestId || "").trim();
    if (!base || !requestId) {
      showToast("Could not open request.");
      return;
    }
    const equipmentId =
  String(
    row && row.equipmentId || ""
  ).trim();

const url =
  base +
  "?page=process&rid=" +
  encodeURIComponent(requestId) +
  (
    equipmentId
      ? "&eq=" + encodeURIComponent(equipmentId)
      : ""
  );
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) window.top.location.href = url;
  }

  function queueRenderTable() {
    const tbody = $("queueTableBody");
    const empty = $("queueEmptyState");
    if (!tbody) return;

    tbody.innerHTML = "";

    const filtered = queueFilteredList();
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / QUEUE_PAGE_SIZE));
    if (queueState.page >= pages) queueState.page = pages - 1;

    const start = queueState.page * QUEUE_PAGE_SIZE;
    const slice = filtered.slice(start, start + QUEUE_PAGE_SIZE);

    if (empty) empty.classList.toggle("hidden", slice.length !== 0);

    slice.forEach(row => {
      const tr = document.createElement("tr");
      if (queueState.bucket === "pending") tr.classList.add("queue-row--accent");

      const tdRequest = document.createElement("td");
      tdRequest.className = "queue-cell-mono";
      tdRequest.textContent = row.requestId || "";

      const tdEquipment = document.createElement("td");
      tdEquipment.className = "queue-cell-eq";
      tdEquipment.textContent = row.equipmentId || "";

      const tdSubmitted = document.createElement("td");
      tdSubmitted.textContent = queueFormatSubmitted(row.createdAt);

      const tdReason = document.createElement("td");
      tdReason.textContent = row.reason || "—";

      const tdRequester = document.createElement("td");
      const requesterName = document.createElement("span");
      requesterName.textContent = row.name || "—";
      tdRequester.appendChild(requesterName);
      if (row.company) {
        const company = document.createElement("span");
        company.className = "queue-cell-sub";
        company.textContent = row.company;
        tdRequester.appendChild(company);
      }

      const tdStatus = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "queue-badge-status " + queueStatusBadgeClass(row.status);
      badge.textContent =
  queueStatusLabel(row);
      tdStatus.appendChild(badge);

      const tdAction = document.createElement("td");
      tdAction.style.textAlign = "right";
      const open = document.createElement("button");
      open.type = "button";
      open.className = "queue-open-btn";
      open.textContent = "Open";
      open.addEventListener("click", () => queueNavigateToProcess(row));
      tdAction.appendChild(open);

      tr.appendChild(tdRequest);
      tr.appendChild(tdEquipment);
      tr.appendChild(tdSubmitted);
      tr.appendChild(tdReason);
      tr.appendChild(tdRequester);
      tr.appendChild(tdStatus);
      tr.appendChild(tdAction);
      tbody.appendChild(tr);
    });

    const badgePending = $("queueBadgePending");
    const badgeFinalized = $("queueBadgeFinalized");
    const badgeCancelled = $("queueBadgeCancelled");
    if (badgePending) badgePending.textContent = String(queueState.counts.pending || 0);
    if (badgeFinalized) badgeFinalized.textContent = String(queueState.counts.finalized || 0);
    if (badgeCancelled) badgeCancelled.textContent = String(queueState.counts.cancelled || 0);

    const summary = $("queueFooterSummary");
    if (summary) {
      const label = queueState.bucket;
      summary.textContent = total
        ? "Showing " + (start + 1) + "–" + Math.min(start + slice.length, total) + " of " + total + " " + label + " requests"
        : "Showing 0 " + label + " requests";
    }

    const prev = $("queuePagePrev");
    const next = $("queuePageNext");
    if (prev) prev.disabled = queueState.page <= 0;
    if (next) next.disabled = queueState.page >= pages - 1;
  }

  function queueSetTab(bucket) {
    queueState.bucket = bucket;
    queueState.page = 0;

    [
      ["queueTabPending", "pending"],
      ["queueTabFinalized", "finalized"],
      ["queueTabCancelled", "cancelled"]
    ].forEach(([id, value]) => {
      const el = $(id);
      if (!el) return;
      const active = value === bucket;
      el.classList.toggle("queue-tab--active", active);
      el.setAttribute("aria-selected", active ? "true" : "false");
    });

    queueRenderTable();
  }

  function queueUpdateSyncText() {
    const el = $("queueSyncText");
    if (!el) return;
    const t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    el.textContent = "Updated at " + t;
  }

  async function loadQueueData() {
    const refreshButtons = [$("queueRefreshBtn"), $("queueTopRefreshBtn")].filter(Boolean);
    refreshButtons.forEach(btn => { btn.disabled = true; });

    try {
      const raw = await getProcessorQueueServer();
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!data || !data.ok) throw new Error((data && data._error) || "Failed to load queue.");

      queueState.rows = data.rows || { pending: [], finalized: [], cancelled: [] };
      queueState.counts = data.counts || { pending: 0, finalized: 0, cancelled: 0 };
      queueUpdateSyncText();
      queueRenderTable();
    } catch (err) {
      showFriendlyError(err);
      queueState.rows = { pending: [], finalized: [], cancelled: [] };
      queueState.counts = { pending: 0, finalized: 0, cancelled: 0 };
      queueRenderTable();
    } finally {
      refreshButtons.forEach(btn => { btn.disabled = false; });
    }
  }

  function initProcessorQueuePage() {
    const search = $("queueSearchInput");
    if (search) {
      search.value = "";
      queueState.search = "";
      queueState.page = 0;
    }

    if (!queueListenersBound) {
      queueListenersBound = true;

      if (search) {
        search.addEventListener("input", () => {
          queueState.search = search.value || "";
          queueState.page = 0;
          queueRenderTable();
        });
      }

      $("queueTabPending")?.addEventListener("click", () => queueSetTab("pending"));
      $("queueTabFinalized")?.addEventListener("click", () => queueSetTab("finalized"));
      $("queueTabCancelled")?.addEventListener("click", () => queueSetTab("cancelled"));
      $("queueRefreshBtn")?.addEventListener("click", loadQueueData);
      $("queueTopRefreshBtn")?.addEventListener("click", loadQueueData);

      $("queuePagePrev")?.addEventListener("click", () => {
        if (queueState.page > 0) {
          queueState.page -= 1;
          queueRenderTable();
        }
      });

      $("queuePageNext")?.addEventListener("click", () => {
        const pages = Math.max(1, Math.ceil(queueFilteredList().length / QUEUE_PAGE_SIZE));
        if (queueState.page < pages - 1) {
          queueState.page += 1;
          queueRenderTable();
        }
      });
    }

    queueSetTab("pending");
    loadQueueData();
  }

  // ==================== EVENT BINDING ====================
  function bindEventsOnce() {
    if (listenersBound) return;
    listenersBound = true;

    // Top-level tabs are real navigation in V2.
tabRequest?.addEventListener("click", () => {
  if (!currentContext.capabilities.canRequest) return;

  const eq =
    String(
      getParam("eq") ||
      (currentProcessRequest && currentProcessRequest.EquipmentId) ||
      (currentEquipmentData && currentEquipmentData.equipmentId) ||
      ""
    ).trim();

  if (!eq) {
    navigateTo("request", {});
    return;
  }

  navigateTo("request", {
    eq: eq,
    mode: "break"
  });
});

    tabProcess?.addEventListener("click", () => {
      if (!currentContext.capabilities.canProcess) return;
      navigateTo("queue", { eq: "" });
    });

    tabInitial?.addEventListener("click", () => {
      if (!currentContext.capabilities.canInitialSeal) return;
      if (currentEquipmentData && currentEquipmentData.isRegistered) {
        showEquipmentActionChooser(currentEquipmentData);
      } else if (getParam("eq")) {
        setView("initial");
      }
    });

    // Request form
    submitBtn?.addEventListener("click", submitRequestAction);
    clearBtn?.addEventListener("click", clearRequestForm);
    [reqReason, reqName, reqCompany, reqPhone].filter(Boolean).forEach(field => {
      field.addEventListener("input", updateRequestSubmitState);
      field.addEventListener("change", updateRequestSubmitState);
    });

    requestAnotherBtn?.addEventListener("click", async () => {
      clearRequestForm();
      currentEquipmentMode = "request";
      setUrlParam("mode", "break");
      await loadEquipment();
    });

    // Initial registration
    addSealBtn?.addEventListener("click", () => addSealInputRow(sealList, "", "seal-input"));
    saveInitialBtn?.addEventListener("click", initialSealSaveAction);

    registerInitialBtn?.addEventListener("click", () => {
      if (!currentContext.capabilities.canInitialSeal) return;
      resetInitialSealForm();
      setView("initial");
    });

    viewSealBtn?.addEventListener("click", async () => {
      currentEquipmentMode = "";
      setUrlParam("mode", "");
      await loadEquipment();
    });

    // Registered Initial Seal action chooser
    actionAddSealBtn?.addEventListener("click", () => {
      if (!currentEquipmentData) return;
      enterAddSealMode(currentEquipmentData);
    });

    actionRequestBreakBtn?.addEventListener("click", () => {
      if (!currentEquipmentData) return;
      enterRequestMode(currentEquipmentData);
    });

    // Add Seal(s)
    addAnotherSealBtn?.addEventListener("click", () => addSealInputRow(addSealList, "", "add-seal-input"));
    saveAddSealsBtn?.addEventListener("click", addSealsAction);
    backFromAddSealBtn?.addEventListener("click", () => {
      if (currentEquipmentData) showEquipmentActionChooser(currentEquipmentData);
    });
    addMoreSealBtn?.addEventListener("click", () => {
      if (currentEquipmentData) enterAddSealMode(currentEquipmentData);
    });

  // Processor batch fields
[removalDate, processRemarks]
  .filter(Boolean)
  .forEach(field => {
    field.addEventListener(
      "input",
      updateFinalizeButtonState
    );

    field.addEventListener(
      "change",
      updateFinalizeButtonState
    );
  });

    finalizeBtn?.addEventListener("click", finalizeAction);
    cancelBtn?.addEventListener("click", cancelAction);

    // Unregistered / contact
    contactOwnerBtn?.addEventListener("click", () => {
      const eq = getParam("eq");
      if (contactMailto) {
        contactMailto.setAttribute(
          "href",
          "mailto:?subject=" + encodeURIComponent("Initial Seal registration needed") +
          "&body=" + encodeURIComponent("Please register initial seal for equipment: " + eq)
        );
      }
      contactModal?.classList.remove("hidden");
    });

    closeContactBtn?.addEventListener("click", () => contactModal?.classList.add("hidden"));
    contactMailto?.addEventListener("click", () => contactModal?.classList.add("hidden"));
    refreshUnregBtn?.addEventListener("click", () => loadEquipment());
    backRequestBtn?.addEventListener("click", () => loadEquipment());

    // Legacy control: if it exists, reload the current equipment instead of doing nothing.
    scanAnotherBtn?.addEventListener("click", () => {
      navigateTo("request", { eq: "" });
    });
  }

  // ==================== INIT ====================
  async function init() {
    console.log("app.js V2 loaded", {
      version: window.__APP_VERSION__,
      pageParams: PAGE_PARAMS
    });

    bindEventsOnce();

    const versionEl = $("appVersion");
    if (versionEl) versionEl.textContent = window.__APP_VERSION__;

    const eq = String(getParam("eq") || "").trim();
    if (eq) lockEquipmentFields(eq);

    try {
      currentContext = normalizeContext(await getUserContextServer());
      console.log("[context]", currentContext);

      if (userChip) {
        userChip.setAttribute("label", truncateEmail(currentContext.email));
        userChip.title = currentContext.email || "";
      }
      setRequesterEmail(currentContext.email);
      configureTabs();
      revealMainTabs();

      const page = String(getParam("page") || "request").toLowerCase();

      if (page === "queue") {
        if (!currentContext.capabilities.canProcess) {
          setView("unauthorized");
          return;
        }
        setView("queue");
        initProcessorQueuePage();
        return;
      }

      if (page === "process") {
        if (!currentContext.capabilities.canProcess) {
          setView("unauthorized");
          return;
        }
        await loadRequest();
        return;
      }

      // QR links point to page=request&eq=... . Registered Initial Seal users
      // will get the chooser; other users get the request form directly.
      await loadEquipment();
    } catch (err) {
      console.error("Initialization failed:", err);
      revealMainTabs();
      const bootSub = $("bootLoadingSubtitle");
      if (bootSub) bootSub.textContent = "Failed to load. Please refresh the page.";
      showFriendlyError(err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

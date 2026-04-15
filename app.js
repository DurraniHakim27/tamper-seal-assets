window.__APP_JS_LOADED = true;
window.__APP_VERSION__ = "20260415_processor_queue";
(function () {
  const seed = "#1D3B6E";
  const mcu = window.materialColorUtilities;
  const themeEnabled = false;

  function applyTheme() {
    if (!mcu || !themeEnabled) return;
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
      "--md-sys-color-tertiary-container": hexFromArgb(light.tertiaryContainer),
      "--md-sys-color-on-tertiary-container": hexFromArgb(light.onTertiaryContainer),
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
  }

  applyTheme();

  window.__APP_JS_LOADED = true;
  console.log("app.js loaded", { pageParams: window.PAGE_PARAMS || null, version: window.__APP_VERSION__ });

  // ==================== PENDING REQUEST MEMORY ====================
  // Client-side safety net: remember recently submitted requests so refresh
  // always shows "in progress" even if server lookup is slow or fails.
  const PENDING_KEY = "__tamperSeal_pendingRequests";
  const PENDING_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

  function savePendingLocally(equipmentId, requestId) {
    try {
      const store = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "{}");
      store[equipmentId] = { requestId, ts: Date.now() };
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(store));
    } catch (e) { /* ignore */ }
  }

  function getLocalPending(equipmentId) {
    try {
      const store = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "{}");
      const entry = store[equipmentId];
      if (entry && (Date.now() - entry.ts) < PENDING_TTL_MS) return entry;
    } catch (e) { /* ignore */ }
    return null;
  }

  function clearLocalPending(equipmentId) {
    try {
      const store = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "{}");
      delete store[equipmentId];
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(store));
    } catch (e) { /* ignore */ }
  }

  // ==================== VIEW MAP ====================
  const viewMap = {
    bootLoading: document.getElementById("bootLoadingView"),
    request: document.getElementById("requestView"),
    process: document.getElementById("processView"),
    initial: document.getElementById("initialView"),
    unregistered: document.getElementById("unregisteredView"),
    inProgress: document.getElementById("inProgressView"),
    unauthorized: document.getElementById("unauthorizedView"),
    alreadyProcessed: document.getElementById("alreadyProcessedView"),
    initialSuccess: document.getElementById("initialSuccessView"),
    requestSuccess: document.getElementById("requestSuccessView"),
    finalizeSuccess: document.getElementById("finalizeSuccessView"),
    queue: document.getElementById("queueView")
  };

  const mainTabs = document.getElementById("mainTabs");
  const tabRequest = document.getElementById("tabRequest");
  const tabProcess = document.getElementById("tabProcess");
  const tabInitial = document.getElementById("tabInitial");
  const userChip = document.getElementById("userChip");

  // Immediately hide everything except bootLoading on startup
  Object.entries(viewMap).forEach(([key, el]) => {
    if (!el) return;
    if (key === "bootLoading") { el.classList.remove("hidden"); }
    else { el.classList.add("hidden"); }
  });
  if (mainTabs) mainTabs.style.visibility = "hidden";

  function revealMainTabs() {
    if (mainTabs) mainTabs.style.visibility = "";
  }

  // Force-hide legacy action buttons from older cached HTML
  ["backHomeBtnDup","backHomeUnauthorizedBtn","backHomeProcessedBtn",
   "backHomeBtn","downloadSummaryBtn","closeFinalizeBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = "none"; el.disabled = true; }
  });

  const snackbar = document.getElementById("snackbar");
  const sealChips = document.getElementById("sealChips");
  const reqEquipment = document.getElementById("reqEquipment");
  const reqEmail = document.getElementById("reqEmail");
  const requestSubtitle = document.getElementById("requestSubtitle");
  const reqReason = document.getElementById("reqReason");
  const reqName = document.getElementById("reqName");
  const reqCompany = document.getElementById("reqCompany");
  const reqPhone = document.getElementById("reqPhone");
  const processSubtitle = document.getElementById("processSubtitle");
  const processDebug = document.getElementById("processDebug");
  const processStatus = document.getElementById("processStatus");
  const processSummary = document.getElementById("processSummary");
  const processSeals = document.getElementById("processSeals");
  const mappingList = document.getElementById("mappingList");
  const removalDate = document.getElementById("removalDate");
  const dateInitialsField = document.getElementById("dateInitialsField");
  const processRemarks = document.getElementById("processRemarks");
  const newSealSeg = document.getElementById("newSealSeg");
  const mappingSection = document.getElementById("mappingSection");
  const dateInitialsRow = document.getElementById("dateInitialsRow");
  const initEquipment = document.getElementById("initEquipment");
  const initDateL2 = document.getElementById("initDateL2");
  const initRemarks = document.getElementById("initRemarks");
  const sealList = document.getElementById("sealList");
  const addSealBtn = document.getElementById("addSealBtn");
  const saveInitialBtn = document.getElementById("saveInitialBtn");
  const initialSubtitle = document.getElementById("initialSubtitle");
  const unregisteredSubtitle = document.getElementById("unregisteredSubtitle");
  const unregisteredActions = document.getElementById("unregisteredActions");
  const registerInitialBtn = document.getElementById("registerInitialBtn");
  const contactOwnerBtn = document.getElementById("contactOwnerBtn");
  const refreshUnregBtn = document.getElementById("refreshUnregBtn");
  const backRequestBtn = document.getElementById("backRequestBtn");
  const contactModal = document.getElementById("contactModal");
  const closeContactBtn = document.getElementById("closeContactBtn");
  const contactMailto = document.getElementById("contactMailto");
  const inProgressSubtitle = document.getElementById("inProgressSubtitle");
  const inProgressBody = document.getElementById("inProgressBody");
  const inProgressMeta = document.getElementById("inProgressMeta");
  const scanAnotherBtn = document.getElementById("scanAnotherBtn");
  const alreadyProcessedSubtitle = document.getElementById("alreadyProcessedSubtitle");
  const requestRef = document.getElementById("requestRef");
  const viewSealBtn = document.getElementById("viewSealBtn");
  const submitBtn = document.getElementById("submitBtn");
  const clearBtn = document.getElementById("clearBtn");
  const finalizeBtn = document.getElementById("finalizeBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const urlParams = new URLSearchParams(window.location.search || "");

  let currentRole = null;
  let currentEmail = "";
  let notifiedNotRegistered = false;
  let isUnregistered = false;

  // ==================== UTILITIES ====================
  function showToast(message) {
    const text = String(message || "");
    console.log("[toast]", text);
    try {
      if (snackbar && "open" in snackbar) { snackbar.labelText = text; snackbar.open = true; }
    } catch (e) { /* ignore */ }
  }

  function showFriendlyError(err) {
    const message = (err && err.message) ? err.message : String(err || "");
    if (message.toLowerCase().includes("access denied")) {
      showToast("Access denied: please sign in with gdc account");
      return;
    }
    showToast(message || "Something went wrong");
  }

  function getParam(key) {
    return (PAGE_PARAMS && PAGE_PARAMS[key]) ? PAGE_PARAMS[key] : (urlParams.get(key) || "");
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

  function getPageParams() {
    if (window.PAGE_PARAMS && typeof window.PAGE_PARAMS === "object") return window.PAGE_PARAMS;
    if (typeof PAGE_PARAMS !== "undefined" && PAGE_PARAMS && typeof PAGE_PARAMS === "object") return PAGE_PARAMS;
    return {};
  }

  function resolveWebAppBaseUrl() {
    const p = getPageParams();
    const explicit = String((p && p.webAppUrl) || "").trim();
    if (explicit) return explicit;

    try {
      const here = new URL(window.location.href);
      if (/\/macros\/s\/[^/]+\/exec$/.test(here.pathname)) {
        return here.origin + here.pathname;
      }
    } catch (e) { /* ignore */ }

    try {
      const ref = new URL(document.referrer || "");
      if (/\/macros\/s\/[^/]+\/exec$/.test(ref.pathname)) {
        return ref.origin + ref.pathname;
      }
    } catch (e) { /* ignore */ }
    return "";
  }

  // ==================== QUEUE CHROME (Request Queue Lists page) ====================
  function enterQueueChrome() {
    document.body.classList.add("queue-page-bg");
    const shell = document.querySelector(".app-shell");
    if (shell) shell.classList.add("queue-mode");
    const mc = document.getElementById("mainContainer");
    if (mc) mc.classList.add("queue-wide");
    const bt = document.getElementById("brandTitle");
    if (bt) bt.textContent = "Request Queue Lists";
    const topRef = document.getElementById("queueTopRefreshBtn");
    if (topRef) topRef.classList.remove("hidden");
  }

  function exitQueueChrome() {
    document.body.classList.remove("queue-page-bg");
    const shell = document.querySelector(".app-shell");
    if (shell) shell.classList.remove("queue-mode");
    const mc = document.getElementById("mainContainer");
    if (mc) mc.classList.remove("queue-wide");
    const bt = document.getElementById("brandTitle");
    if (bt) bt.textContent = "Tamper Seal Log";
    const topRef = document.getElementById("queueTopRefreshBtn");
    if (topRef) topRef.classList.add("hidden");
  }

  // ==================== VIEW SWITCHING ====================
  function setView(view) {
    console.log("[setView]", view);
    if (view !== "queue") exitQueueChrome();
    Object.values(viewMap).forEach(v => { if (v) v.classList.add("hidden"); });
    const target = viewMap[view] || viewMap.request;
    if (target) target.classList.remove("hidden");
    if (mainTabs) {
      if (view === "queue") {
        mainTabs.style.display = "none";
      } else {
        mainTabs.style.display = "";
        if (view === "request" || view === "requestSuccess") mainTabs.activeTabIndex = 0;
        if (view === "process" || view === "finalizeSuccess") mainTabs.activeTabIndex = 1;
        if (view === "initial" || view === "initialSuccess") mainTabs.activeTabIndex = 2;
        if (view === "unregistered") {
          const r = currentRole || "";
          mainTabs.activeTabIndex = (r === "INITIAL_SEAL" || r === "ADMIN") ? 2 : 0;
        }
      }
    }
    if (view === "queue") enterQueueChrome();
  }

  function showInProgress(equipmentId, message, meta) {
    if (inProgressSubtitle) inProgressSubtitle.textContent = equipmentId ? "Equipment: " + equipmentId : "";
    if (inProgressBody) inProgressBody.textContent = message || "Oops, someone had requested earlier. Better luck and be earlier next time pal.";
    if (inProgressMeta) inProgressMeta.textContent = meta || "";
    setView("inProgress");
  }

  function setTabsForRole(role, page, opts) {
    const options = opts || {};
    const equipmentUnregistered = !!options.equipmentUnregistered;
    const eqInUrl = !!getParam("eq");
    const lockToInitialFlow = equipmentUnregistered && eqInUrl;
    const showRequestTab = !lockToInitialFlow && (
      role === "CONTRACTOR" || role === "PROCESSOR" || role === "INITIAL_SEAL" || role === "ADMIN"
    );
    const showProcessTab = !lockToInitialFlow && (role === "PROCESSOR" || role === "ADMIN");
    const showInitialTab = role === "INITIAL_SEAL" || role === "ADMIN";

    tabRequest.style.display = "none";
    tabProcess.style.display = "none";
    tabInitial.style.display = "none";
    if (showRequestTab) tabRequest.style.display = "";
    if (showProcessTab) tabProcess.style.display = "";
    if (showInitialTab) tabInitial.style.display = "";

    if (page === "process" && showProcessTab) {
      tabRequest.style.display = "none";
      tabInitial.style.display = "none";
      tabProcess.style.display = "";
    }

    setTabDisabled(tabRequest, true);
    setTabDisabled(tabProcess, true);
    setTabDisabled(tabInitial, true);
  }

  function setTabDisabled(tab, disabled) {
    if (!tab) return;
    tab.classList.toggle("tab-disabled", !!disabled);
  }

  // ==================== FIELD HELPERS ====================
  function lockEquipmentField(value) {
    if (!value) return;
    const apply = () => { reqEquipment.value = value; reqEquipment.setAttribute("value", value); reqEquipment.disabled = true; reqEquipment.readOnly = true; };
    if (window.customElements && customElements.whenDefined) { customElements.whenDefined("md-filled-text-field").then(apply); } else { apply(); }
  }

  function setInitEquipmentField(value) {
    if (!value) return;
    const apply = () => { initEquipment.value = value; initEquipment.setAttribute("value", value); };
    if (window.customElements && customElements.whenDefined) { customElements.whenDefined("md-filled-text-field").then(apply); } else { apply(); }
  }

  function setRequesterEmail(value) {
    if (!value) return;
    const apply = () => { reqEmail.value = value; reqEmail.setAttribute("value", value); reqEmail.disabled = true; reqEmail.readOnly = true; };
    if (window.customElements && customElements.whenDefined) { customElements.whenDefined("md-filled-text-field").then(apply); } else { apply(); }
  }

  function renderSealChips(seals) {
    sealChips.innerHTML = "";
    if (!seals || !seals.length) {
      const empty = document.createElement("div");
      empty.className = "supporting";
      empty.textContent = "No active seals registered yet.";
      sealChips.appendChild(empty);
      return;
    }
    seals.forEach(seal => {
      const chip = document.createElement("md-filter-chip");
      chip.setAttribute("label", seal);
      chip.setAttribute("selected", "");
      chip.addEventListener("click", () => chip.toggleAttribute("selected"));
      sealChips.appendChild(chip);
    });
  }

  function getSelectedSeals() {
    return Array.from(sealChips.querySelectorAll("md-filter-chip[selected]"))
      .map(chip => chip.getAttribute("label"));
  }

  // ==================== PROCESS VIEW ====================
  function renderProcessSummary(req) {
    processSubtitle.textContent = "Request ID: " + req.RequestId;
    processStatus.innerHTML = "";
    const statusChip = document.createElement("md-assist-chip");
    statusChip.className = "status-chip";
    statusChip.setAttribute("label", req.Status || "PENDING");
    processStatus.appendChild(statusChip);
    processSummary.innerHTML = "";
    [["Equipment ID", req.EquipmentId], ["Requester", req.Name + " (" + req.Company + ")"], ["Phone", req.Phone], ["Reason", req.Reason]].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "kv-item";
      item.innerHTML = '<div class="kv-label">' + label + '</div><div class="kv-value">' + (value || "") + '</div>';
      processSummary.appendChild(item);
    });
    processSeals.innerHTML = "";
    const selected = JSON.parse(req.SelectedOldSeals || "[]");
    selected.forEach(seal => { const chip = document.createElement("md-assist-chip"); chip.setAttribute("label", seal); processSeals.appendChild(chip); });
    mappingList.innerHTML = "";
    selected.forEach(seal => {
      const row = document.createElement("div");
      row.className = "row two";
      row.innerHTML = '<md-assist-chip label="' + seal + '"></md-assist-chip><md-outlined-text-field class="mapping-field" data-old="' + seal + '" label="New seal for ' + seal + '" supporting-text="Required"></md-outlined-text-field>';
      mappingList.appendChild(row);
    });
  }

  function showProcessEmpty(message, rid) {
    const suffix = rid ? " (" + rid + ")" : "";
    processSubtitle.textContent = (message || "Request details unavailable.") + suffix;
    processStatus.innerHTML = "";
    processSummary.innerHTML = "";
    processSeals.innerHTML = "";
    mappingList.innerHTML = "";
    if (processDebug && getParam("debugUi") !== "1") processDebug.classList.add("hidden");
  }

  function renderProcessDebug(info) {
    if (!processDebug) return;
    const next = JSON.stringify(info, null, 2);
    const existing = processDebug.textContent ? processDebug.textContent.trim() : "";
    processDebug.textContent = existing ? existing + "\n\n" + next : next;
    processDebug.classList.remove("hidden");
    processDebug.style.display = "block";
  }

  function serializeError(err) {
    if (!err) return null;
    return { name: err.name || "", message: err.message || String(err), stack: err.stack || "" };
  }

  // ==================== SEGMENTED / SEAL ROWS ====================
  function updateSealAppliedView() {
    const selected = newSealSeg.querySelector(".segmented-btn[aria-pressed='true']");
    const value = selected ? selected.value : "No";
    const show = value === "Yes";
    mappingSection.classList.toggle("hidden", !show);
    dateInitialsRow.classList.toggle("hidden", !show);
    mappingList.querySelectorAll(".mapping-field").forEach(field => { field.disabled = !show; if (!show) field.value = ""; });
    dateInitialsField.disabled = !show;
    if (!show) dateInitialsField.value = "";
  }

  newSealSeg.querySelectorAll(".segmented-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      newSealSeg.querySelectorAll(".segmented-btn").forEach(b => b.setAttribute("aria-pressed", "false"));
      btn.setAttribute("aria-pressed", "true");
      updateSealAppliedView();
    });
  });

  function addSealRow(value) {
    const row = document.createElement("div");
    row.className = "seal-row";
    row.innerHTML = '<md-outlined-text-field class="seal-input" label="Seal ID" value="' + (value || "") + '" supporting-text="Required"></md-outlined-text-field><button class="icon-btn seal-remove" aria-label="Remove seal"><span class="material-symbols-outlined" aria-hidden="true">delete</span><span class="tooltip">Remove</span></button>';
    sealList.appendChild(row);
    row.querySelector(".seal-remove").addEventListener("click", () => {
      if (sealList.querySelectorAll(".seal-row").length <= 1) return;
      row.remove();
      updateSealRemoveState();
    });
    updateSealRemoveState();
  }

  function updateSealRemoveState() {
    const rows = sealList.querySelectorAll(".seal-row");
    rows.forEach(row => { row.querySelector(".seal-remove").disabled = rows.length <= 1; });
  }

  addSealBtn.addEventListener("click", () => addSealRow(""));

  function collectSealIds() {
    const values = Array.from(sealList.querySelectorAll(".seal-input")).map(input => input.value.trim()).filter(Boolean);
    const duplicates = values.filter((v, i, arr) => arr.indexOf(v) !== i);
    sealList.querySelectorAll(".seal-input").forEach(input => {
      if (duplicates.includes(input.value.trim())) { input.setAttribute("error", ""); input.setAttribute("supporting-text", "Duplicate"); }
      else { input.removeAttribute("error"); input.setAttribute("supporting-text", "Required"); }
    });
    return { values, duplicates };
  }

  // ==================== ACTIONS ====================
  saveInitialBtn.addEventListener("click", () => {
    const { values, duplicates } = collectSealIds();
    if (duplicates.length) { showToast("Duplicate seal IDs detected"); return; }
    google.script.run
      .withSuccessHandler(() => setView("initialSuccess"))
      .withFailureHandler(err => showToast(err.message || err))
      .initialSealSave({ equipmentId: initEquipment.value, dateL2: initDateL2.value, remarks: initRemarks.value, seals: values });
  });

  submitBtn.addEventListener("click", () => {
    const selectedSeals = getSelectedSeals();
    const equipmentId = reqEquipment.value || getParam("eq");
    if (!equipmentId || !selectedSeals.length) { showToast("Select at least one seal"); return; }
    if (!reqReason.value.trim() || !reqName.value.trim() || !reqCompany.value.trim() || !reqPhone.value.trim()) { showToast("Fill all required fields"); return; }
    submitBtn.disabled = true;
    google.script.run
      .withSuccessHandler(res => {
        submitBtn.disabled = false;
        savePendingLocally(equipmentId, res.requestId);
        if (requestRef) requestRef.textContent = "Ref ID: " + res.requestId + " recorded.";
        setView("requestSuccess");
      })
      .withFailureHandler(err => {
        submitBtn.disabled = false;
        const msg = err && err.message ? err.message : String(err || "Submit failed");
        showToast("Submit failed: " + msg);
      })
      .submitRequest({ equipmentId, selectedSeals, reason: reqReason.value, name: reqName.value, company: reqCompany.value, phone: reqPhone.value });
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      reqReason.value = ""; reqName.value = ""; reqCompany.value = ""; reqPhone.value = "";
      sealChips.querySelectorAll("md-filter-chip[selected]").forEach(chip => chip.removeAttribute("selected"));
    });
  }

  finalizeBtn.addEventListener("click", () => {
    const selected = newSealSeg.querySelector(".segmented-btn[aria-pressed='true']");
    const newSealApplied = selected ? selected.value : "No";
    if (!removalDate.value || !processRemarks.value.trim()) { showToast("Date of removal and remarks required"); return; }
    if (newSealApplied === "Yes" && !dateInitialsField.value.trim()) { showToast("Date / Initials required for new seals"); return; }
    const mapping = {};
    mappingList.querySelectorAll(".mapping-field").forEach(field => { mapping[field.dataset.old] = field.value.trim(); });
    if (newSealApplied === "Yes" && Object.values(mapping).some(v => !v)) { showToast("Provide a new seal ID for each old seal"); return; }
    google.script.run
      .withSuccessHandler(() => {
        const eq = getParam("eq");
        if (eq) clearLocalPending(eq);
        setView("finalizeSuccess");
      })
      .withFailureHandler(err => showToast(err.message || err))
      .finalizeRequest({ requestId: PAGE_PARAMS.rid, newSealApplied, removalDate: removalDate.value, dateInitials: dateInitialsField.value, remarks: processRemarks.value, mapping });
  });

  cancelBtn.addEventListener("click", () => {
    if (!processRemarks.value.trim()) { showToast("Remarks required to cancel"); return; }
    google.script.run
      .withSuccessHandler(() => { const eq = getParam("eq"); if (eq) clearLocalPending(eq); showToast("Request cancelled"); })
      .withFailureHandler(err => showToast(err.message || err))
      .cancelRequest({ requestId: PAGE_PARAMS.rid, remarks: processRemarks.value });
  });

  // ==================== LOAD REQUEST (process page) ====================
  function loadRequest() {
    const rid = getParam("rid");
    const debugEnabled = getParam("debugUi") === "1";
    if (!rid) { showProcessEmpty("No request ID in URL.", rid); return; }
    if (debugEnabled) renderProcessDebug({ debug: "client-init", rid, pageParams: PAGE_PARAMS });
    if (!(google && google.script && google.script.run)) { showProcessEmpty("google.script.run unavailable.", rid); return; }

    let responded = false;
    const timeoutId = setTimeout(() => {
      if (responded) return;
      showProcessEmpty("Request details unavailable.", rid);
    }, 8000);

    const handleSuccess = req => {
      responded = true;
      clearTimeout(timeoutId);
      if (debugEnabled) renderProcessDebug({ debug: "getRequestSuccess", req });
      if (!req || (!req.RequestId && Object.keys(req).length === 0)) { showProcessEmpty("Request details unavailable.", rid); return; }
      if (!req.RequestId) req.RequestId = req.requestId || req.RequestID || rid || "";
      if (req._error) { showProcessEmpty(req._error, rid); return; }
      const status = String(req.Status || "").trim().toUpperCase();
      if (status && status !== "PENDING") {
        if (alreadyProcessedSubtitle) alreadyProcessedSubtitle.textContent = "Request ID: " + req.RequestId;
        setView("alreadyProcessed");
        return;
      }
      if (!debugEnabled && processDebug) processDebug.classList.add("hidden");
      renderProcessSummary(req);
    };

    const handleFailure = err => {
      responded = true;
      clearTimeout(timeoutId);
      showFriendlyError(err);
      showProcessEmpty((err && err.message) || "Request details unavailable.", rid);
    };

    try { google.script.run.withSuccessHandler(handleSuccess).withFailureHandler(handleFailure).getRequestClient(rid); }
    catch (err) {
      try { google.script.run.withSuccessHandler(handleSuccess).withFailureHandler(handleFailure).getRequest(rid); }
      catch (err2) { responded = true; clearTimeout(timeoutId); showProcessEmpty("Request details unavailable.", rid); }
    }
  }

  // ==================== LOAD EQUIPMENT (request/initial page) ====================
  function loadEquipment() {
    const eq = getParam("eq");
    if (!eq) return;
    console.log("[loadEquipment] eq=" + eq);

    // Client-side pending check FIRST — instant, no server wait
    const localPending = getLocalPending(eq);
    if (localPending && getParam("page") !== "process") {
      console.log("[loadEquipment] local pending found", localPending);
      showInProgress(eq, "Oops, someone had requested earlier. Better luck and be earlier next time pal.", "Ref: " + (localPending.requestId || ""));
      return;
    }

    lockEquipmentField(eq);
    setInitEquipmentField(eq);
    if (unregisteredSubtitle) unregisteredSubtitle.textContent = "Equipment: " + eq;

    let responded = false;
    const bootSub = document.getElementById("bootLoadingSubtitle");

    function handleEquipmentData(data) {
      try {
        responded = true;
        console.log("[loadEquipment] raw response:", JSON.stringify(data));
        if (!data) { setView("request"); if (requestSubtitle) requestSubtitle.textContent = "No data returned. Please refresh."; return; }
        if (data._error) { setView("request"); if (requestSubtitle) requestSubtitle.textContent = "Server error: " + data._error; submitBtn.disabled = true; return; }

        const role = currentRole || "CONTRACTOR";
        const canInitial = role === "INITIAL_SEAL" || role === "ADMIN";
        const isRegistered = (typeof data.isRegistered === "boolean") ? data.isRegistered : !!data.hasInitialSeal;

        lockEquipmentField(data.equipmentId);
        setInitEquipmentField(data.equipmentId);
        var dateText = data.dateL2 ? " \u2022 L2: " + data.dateL2 : "";
        if (requestSubtitle) requestSubtitle.textContent = "Equipment: " + data.equipmentId + dateText;
        if (initialSubtitle) initialSubtitle.textContent = "Equipment: " + data.equipmentId;
        if (unregisteredSubtitle) unregisteredSubtitle.textContent = "Equipment: " + data.equipmentId;

        var page = getParam("page") || "request";

        if (data.pendingRequest && page !== "process") {
          console.log("[loadEquipment] PENDING detected");
          savePendingLocally(data.equipmentId, data.pendingRequest.requestId || "");
          var createdAt = "";
          try { createdAt = data.pendingRequest.createdAt ? "Submitted at: " + data.pendingRequest.createdAt : ""; } catch (e) { /* ignore */ }
          showInProgress(data.equipmentId, "Oops, someone had requested earlier. Better luck and be earlier next time pal.", createdAt);
          return;
        }

        if (!isRegistered) {
          submitBtn.disabled = true;
          notifiedNotRegistered = true;
          if (unregisteredActions) {
            if (registerInitialBtn) registerInitialBtn.style.display = canInitial ? "" : "none";
            if (backRequestBtn) backRequestBtn.style.display = "none";
            if (contactOwnerBtn) contactOwnerBtn.style.display = "none";
            if (refreshUnregBtn) refreshUnregBtn.style.display = "none";
          }
          setTabsForRole(currentRole || "CONTRACTOR", page, { equipmentUnregistered: true });
          if (mainTabs && canInitial) mainTabs.activeTabIndex = 2;
          setView("unregistered");
          return;
        }

        isUnregistered = false;
        submitBtn.disabled = false;
        renderSealChips(data.currentSeals || []);
        setTabsForRole(currentRole || "CONTRACTOR", page, { equipmentUnregistered: false });
        setView("request");
      } catch (jsErr) {
        console.error("[loadEquipment] JS ERROR in success handler:", jsErr);
        setView("request");
        if (requestSubtitle) requestSubtitle.textContent = "Error: " + (jsErr.message || jsErr);
      }
    }

    function handleEquipmentError(err) {
      try {
        responded = true;
        console.log("[loadEquipment] SERVER ERROR", err && err.message);
        var message = (err && err.message) ? err.message : String(err || "Unknown error");
        if (message.toLowerCase().includes("equipment id not found")) {
          submitBtn.disabled = true;
          if (unregisteredSubtitle) unregisteredSubtitle.textContent = "Equipment: " + eq;
          if (unregisteredActions) {
            if (registerInitialBtn) registerInitialBtn.style.display = "none";
            if (backRequestBtn) backRequestBtn.style.display = "none";
            if (contactOwnerBtn) contactOwnerBtn.style.display = "";
            if (refreshUnregBtn) refreshUnregBtn.style.display = "";
          }
          setTabsForRole(currentRole || "CONTRACTOR", getParam("page") || "request", { equipmentUnregistered: true });
          if (mainTabs && (currentRole === "INITIAL_SEAL" || currentRole === "ADMIN")) mainTabs.activeTabIndex = 2;
          setView("unregistered");
        } else {
          setView("request");
          if (requestSubtitle) requestSubtitle.textContent = "Error: " + message;
          submitBtn.disabled = true;
        }
      } catch (jsErr) {
        console.error("[loadEquipment] JS ERROR in failure handler:", jsErr);
        setView("request");
        if (requestSubtitle) requestSubtitle.textContent = "Error: " + (jsErr.message || jsErr);
      }
    }

    // Timeout: after 12s force-show something so page never stays stuck on Loading
    var timeoutId = setTimeout(function () {
      if (responded) return;
      console.log("[loadEquipment] TIMEOUT 12s — forcing visible state");
      responded = true;
      setView("request");
      if (requestSubtitle) requestSubtitle.textContent = "Server is taking too long. Please refresh.";
      submitBtn.disabled = true;
    }, 12000);

    function handleJsonString(jsonStr) {
      clearTimeout(timeoutId);
      console.log("[loadEquipment] JSON string response length:", jsonStr ? jsonStr.length : 0);
      try {
        var parsed = JSON.parse(jsonStr);
        handleEquipmentData(parsed);
      } catch (parseErr) {
        console.error("[loadEquipment] JSON parse failed:", parseErr, "raw:", jsonStr);
        handleEquipmentData(null);
      }
    }

    try {
      google.script.run
        .withSuccessHandler(handleJsonString)
        .withFailureHandler(function (err) {
          console.log("[loadEquipment] getEquipmentDataJson failed, trying getEquipmentData", err && err.message);
          try {
            google.script.run
              .withSuccessHandler(function (data) { clearTimeout(timeoutId); handleEquipmentData(data); })
              .withFailureHandler(function (err2) { clearTimeout(timeoutId); handleEquipmentError(err2); })
              .getEquipmentData(eq);
          } catch (e) { clearTimeout(timeoutId); handleEquipmentError(err); }
        })
        .getEquipmentDataJson(eq);
    } catch (callErr) {
      console.log("[loadEquipment] getEquipmentDataJson not available, using getEquipmentData");
      try {
        google.script.run
          .withSuccessHandler(function (data) { clearTimeout(timeoutId); handleEquipmentData(data); })
          .withFailureHandler(function (err) { clearTimeout(timeoutId); handleEquipmentError(err); })
          .getEquipmentData(eq);
      } catch (callErr2) {
        clearTimeout(timeoutId); responded = true;
        setView("request");
        if (requestSubtitle) requestSubtitle.textContent = "Error calling server. Please refresh.";
      }
    }
  }

  // ==================== PROCESSOR QUEUE ====================
  const QUEUE_PAGE_SIZE = 8;
  let queueListenersBound = false;
  let queueState = {
    bucket: "pending",
    search: "",
    page: 0,
    rows: { pending: [], finalized: [], cancelled: [] },
    counts: { pending: 0, finalized: 0, cancelled: 0 }
  };

  function queueFormatSubmitted(isoStr) {
    const t = Date.parse(isoStr);
    if (isNaN(t)) return { line: isoStr ? String(isoStr) : "—" };
    const now = Date.now();
    const diffMs = Math.max(0, now - t);
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let age = "";
    if (days >= 1) age = "(" + days + (days === 1 ? " day" : " days") + ")";
    else if (hours >= 1) age = "(" + hours + (hours === 1 ? " hour" : " hours") + ")";
    else if (mins >= 1) age = "(" + mins + " min)";
    else age = "(just now)";

    const d = new Date(t);
    const today = new Date();
    const isSameDay = d.toDateString() === today.toDateString();
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    const isYest = d.toDateString() === yest.toDateString();
    const timePart = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    let label = "";
    if (isSameDay) label = "Today, " + timePart;
    else if (isYest) label = "Yesterday, " + timePart;
    else {
      const opts = { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
      if (d.getFullYear() !== today.getFullYear()) opts.year = "numeric";
      label = d.toLocaleString([], opts);
    }
    return { line: label + " " + age };
  }

  function queueStatusBadgeClass(status) {
    const s = String(status || "").toUpperCase();
    if (s === "FINALIZED") return "queue-badge--finalized";
    if (s === "CANCELLED" || s === "REJECTED") return "queue-badge--cancelled";
    return "queue-badge--pending";
  }

  function queueStatusLabel(status) {
    const s = String(status || "").toUpperCase();
    if (s === "FINALIZED") return "Finalized";
    if (s === "CANCELLED" || s === "REJECTED") return "Cancelled";
    return "Pending";
  }

  function queueRowMatchesSearch(row, q) {
    if (!q) return true;
    const s = q.toLowerCase().trim();
    const reqer = (row.name + " / " + row.company).toLowerCase();
    return (
      String(row.requestId || "").toLowerCase().includes(s) ||
      String(row.equipmentId || "").toLowerCase().includes(s) ||
      String(row.reason || "").toLowerCase().includes(s) ||
      reqer.includes(s) ||
      String(row.name || "").toLowerCase().includes(s) ||
      String(row.company || "").toLowerCase().includes(s)
    );
  }

  function queueFilteredList() {
    const list = queueState.rows[queueState.bucket] || [];
    return list.filter(r => queueRowMatchesSearch(r, queueState.search));
  }

  function queueNavigateToProcess(rowOrRequestId) {
    const requestId = (rowOrRequestId && typeof rowOrRequestId === "object")
      ? String(rowOrRequestId.requestId || "").trim()
      : String(rowOrRequestId || "").trim();
    const rowUrl = (rowOrRequestId && typeof rowOrRequestId === "object")
      ? String(rowOrRequestId.processUrl || "").trim()
      : "";
    const explicitBase = resolveWebAppBaseUrl();
    const safeRequestId = encodeURIComponent(requestId);
    const target = rowUrl || (explicitBase
      ? (explicitBase + "?page=process&rid=" + safeRequestId)
      : (new URL(window.location.href).origin + new URL(window.location.href).pathname + "?page=process&rid=" + safeRequestId));
    console.log("[queue] open process target:", target);

    // Apps Script panel/iframe can white-screen with in-frame navigation.
    // Opening a real top-level tab is the most reliable path.
    try {
      const opened = window.open(target, "_blank", "noopener,noreferrer");
      if (opened) return;
    } catch (e) {
      console.warn("[queue] window.open failed, trying _top navigation", e);
    }

    // Fallback: force top-level navigation in same tab.
    try {
      const a = document.createElement("a");
      a.href = target;
      a.target = "_top";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    } catch (e) {
      console.warn("[queue] _top link navigation failed, fallback to location.assign", e);
    }

    try {
      window.top.location.href = target;
      return;
    } catch (e) { /* ignore cross-origin */ }

    window.location.assign(target);
  }

  function queueRenderTable() {
    const tbody = document.getElementById("queueTableBody");
    const table = document.getElementById("queueTable");
    const emptyEl = document.getElementById("queueEmptyState");
    if (!tbody || !table || !emptyEl) return;

    const filtered = queueFilteredList();
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / QUEUE_PAGE_SIZE) || 1);
    if (queueState.page >= pages) queueState.page = Math.max(0, pages - 1);
    const start = queueState.page * QUEUE_PAGE_SIZE;
    const slice = filtered.slice(start, start + QUEUE_PAGE_SIZE);

    tbody.innerHTML = "";
    if (!slice.length) {
      table.classList.add("hidden");
      emptyEl.classList.remove("hidden");
    } else {
      table.classList.remove("hidden");
      emptyEl.classList.add("hidden");
    }

    slice.forEach((row, idx) => {
      const tr = document.createElement("tr");
      if (queueState.bucket === "pending" && queueState.page === 0 && idx === 0) {
        tr.className = "queue-row--accent";
      }
      const submitted = queueFormatSubmitted(row.createdAt);
      const badgeClass = queueStatusBadgeClass(row.status);
      const badgeIcon = queueState.bucket === "pending" ? "schedule" : (queueState.bucket === "finalized" ? "check_circle" : "block");
      const requester = (row.name || "—") + " / " + (row.company || "—");

      const td0 = document.createElement("td");
      const ridSpan = document.createElement("span");
      ridSpan.className = "queue-cell-mono";
      ridSpan.textContent = row.requestId || "";
      td0.appendChild(ridSpan);

      const td1 = document.createElement("td");
      const eqSpan = document.createElement("span");
      eqSpan.className = "queue-cell-eq";
      eqSpan.textContent = row.equipmentId || "";
      td1.appendChild(eqSpan);

      const td2 = document.createElement("td");
      td2.textContent = submitted.line;

      const td3 = document.createElement("td");
      td3.textContent = row.reason || "—";

      const td4 = document.createElement("td");
      td4.textContent = requester;

      const td5 = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = "queue-badge-status " + badgeClass;
      const ic = document.createElement("span");
      ic.className = "material-symbols-outlined";
      ic.setAttribute("aria-hidden", "true");
      ic.textContent = badgeIcon;
      const bt = document.createElement("span");
      bt.textContent = queueStatusLabel(row.status);
      badge.appendChild(ic);
      badge.appendChild(bt);
      td5.appendChild(badge);

      const td6 = document.createElement("td");
      td6.style.textAlign = "right";
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "queue-open-btn";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => queueNavigateToProcess(row));
      td6.appendChild(openBtn);

      tr.appendChild(td0);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tr.appendChild(td4);
      tr.appendChild(td5);
      tr.appendChild(td6);
      tbody.appendChild(tr);
    });

    const badgeP = document.getElementById("queueBadgePending");
    const badgeF = document.getElementById("queueBadgeFinalized");
    const badgeC = document.getElementById("queueBadgeCancelled");
    if (badgeP) badgeP.textContent = String(queueState.counts.pending);
    if (badgeF) badgeF.textContent = String(queueState.counts.finalized);
    if (badgeC) badgeC.textContent = String(queueState.counts.cancelled);

    const bucketLabel = queueState.bucket === "pending" ? "pending" : (queueState.bucket === "finalized" ? "finalized" : "cancelled");
    const summary = document.getElementById("queueFooterSummary");
    if (summary) {
      if (queueState.search.trim()) {
        summary.textContent = "Showing " + slice.length + " of " + total + " filtered " + bucketLabel + " requests (page " + (queueState.page + 1) + " of " + pages + ")";
      } else {
        summary.textContent = "Showing " + slice.length + " of " + total + " " + bucketLabel + " requests";
      }
    }

    const prev = document.getElementById("queuePagePrev");
    const next = document.getElementById("queuePageNext");
    if (prev) prev.disabled = queueState.page <= 0;
    if (next) next.disabled = queueState.page >= pages - 1;
  }

  function queueSetTab(bucket) {
    queueState.bucket = bucket;
    queueState.page = 0;
    ["queueTabPending", "queueTabFinalized", "queueTabCancelled"].forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const b = ["pending", "finalized", "cancelled"][i];
      const active = b === bucket;
      el.classList.toggle("queue-tab--active", active);
      el.setAttribute("aria-selected", active ? "true" : "false");
    });
    queueRenderTable();
  }

  function queueUpdateSyncText() {
    const el = document.getElementById("queueSyncText");
    if (!el) return;
    const t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    el.textContent = "Updated at " + t;
  }

  function loadQueueData() {
    if (!(google && google.script && google.script.run)) {
      showToast("Cannot load queue (offline)");
      return;
    }
    google.script.run
      .withSuccessHandler(jsonStr => {
        try {
          const data = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
          if (!data || !data.ok) {
            showToast((data && data._error) || "Failed to load queue");
            queueState.rows = { pending: [], finalized: [], cancelled: [] };
            queueState.counts = { pending: 0, finalized: 0, cancelled: 0 };
            queueRenderTable();
            return;
          }
          queueState.rows = data.rows || { pending: [], finalized: [], cancelled: [] };
          queueState.counts = data.counts || { pending: 0, finalized: 0, cancelled: 0 };
          queueUpdateSyncText();
          queueRenderTable();
        } catch (e) {
          showToast("Queue data error");
          console.error(e);
        }
      })
      .withFailureHandler(err => {
        showFriendlyError(err);
        queueState.rows = { pending: [], finalized: [], cancelled: [] };
        queueState.counts = { pending: 0, finalized: 0, cancelled: 0 };
        queueRenderTable();
      })
      .getProcessorQueueJson();
  }

  function initProcessorQueuePage() {
    const search = document.getElementById("queueSearchInput");
    if (search) {
      search.value = "";
      queueState.search = "";
      queueState.page = 0;
      queueState.bucket = "pending";
    }

    if (!queueListenersBound) {
      queueListenersBound = true;
      if (search) {
        search.addEventListener("input", () => {
          queueState.search = search.value;
          queueState.page = 0;
          queueRenderTable();
        });
      }
      document.getElementById("queueTabPending")?.addEventListener("click", () => queueSetTab("pending"));
      document.getElementById("queueTabFinalized")?.addEventListener("click", () => queueSetTab("finalized"));
      document.getElementById("queueTabCancelled")?.addEventListener("click", () => queueSetTab("cancelled"));
      document.getElementById("queueRefreshBtn")?.addEventListener("click", () => loadQueueData());
      document.getElementById("queueTopRefreshBtn")?.addEventListener("click", () => loadQueueData());
      document.getElementById("queuePagePrev")?.addEventListener("click", () => {
        if (queueState.page > 0) { queueState.page--; queueRenderTable(); }
      });
      document.getElementById("queuePageNext")?.addEventListener("click", () => {
        const filtered = queueFilteredList();
        const pages = Math.max(1, Math.ceil(filtered.length / QUEUE_PAGE_SIZE));
        if (queueState.page < pages - 1) { queueState.page++; queueRenderTable(); }
      });
    }

    queueSetTab("pending");
    loadQueueData();
  }

  // ==================== INIT ====================
  function init() {
    const eqPrefill = getParam("eq");
    if (eqPrefill) {
      lockEquipmentField(eqPrefill);
      setInitEquipmentField(eqPrefill);
      if (requestSubtitle) requestSubtitle.textContent = "Equipment: " + eqPrefill;
      if (initialSubtitle) initialSubtitle.textContent = "Equipment: " + eqPrefill;
    } else {
      console.log("No equipment ID in URL (eq=...)");
    }

    google.script.run.withSuccessHandler(ctx => {
      currentRole = ctx.role;
      currentEmail = ctx.email || "";
      const page = getParam("page") || "request";
      console.log("[init] role=" + ctx.role + " email=" + ctx.email + " page=" + page);
      userChip.setAttribute("label", truncateEmail(ctx.email));
      if (userChip) userChip.title = ctx.email || "";
      setRequesterEmail(ctx.email);

      if (page === "queue") {
        revealMainTabs();
        if (ctx.role !== "PROCESSOR" && ctx.role !== "ADMIN") {
          mainTabs.style.display = "";
          setTabsForRole(ctx.role, "request", { equipmentUnregistered: !!eqPrefill });
          setView("unauthorized");
          return;
        }
        mainTabs.style.display = "none";
        setTabsForRole(ctx.role, "queue", { equipmentUnregistered: false });
        setView("queue");
        initProcessorQueuePage();
        return;
      }

      setTabsForRole(ctx.role, page, { equipmentUnregistered: !!eqPrefill });
      revealMainTabs();

      const role = ctx.role;
      const canRequest = role === "CONTRACTOR" || role === "PROCESSOR" || role === "INITIAL_SEAL" || role === "ADMIN";
      const canProcess = role === "PROCESSOR" || role === "INITIAL_SEAL" || role === "ADMIN";
      const canInitial = role === "INITIAL_SEAL" || role === "ADMIN";

      if (page === "process") {
        if (role !== "PROCESSOR") { setView("unauthorized"); return; }
        setView("process");
        loadRequest();
        return;
      }

      // Keep bootLoading visible until loadEquipment finishes.
      // Do NOT show request form yet — it would flash before we know the real state.

      // Wire up tab clicks (all no-op for safety)
      tabRequest.addEventListener("click", () => {});
      tabProcess.addEventListener("click", () => {});
      tabInitial.addEventListener("click", () => {});

      if (registerInitialBtn) {
        registerInitialBtn.addEventListener("click", () => {
          if (currentRole !== "INITIAL_SEAL" && currentRole !== "ADMIN") { return; }
          setView("initial");
        });
      }
      if (contactOwnerBtn && contactModal) {
        contactOwnerBtn.addEventListener("click", () => {
          const eq = getParam("eq");
          if (contactMailto) {
            contactMailto.setAttribute("href", "mailto:?subject=" + encodeURIComponent("Initial Seal registration needed") + "&body=" + encodeURIComponent("Please register initial seal for equipment: " + eq));
          }
          contactModal.classList.remove("hidden");
        });
      }
      if (closeContactBtn && contactModal) closeContactBtn.addEventListener("click", () => contactModal.classList.add("hidden"));
      if (contactMailto && contactModal) contactMailto.addEventListener("click", () => contactModal.classList.add("hidden"));
      if (refreshUnregBtn) refreshUnregBtn.addEventListener("click", () => loadEquipment());
      if (scanAnotherBtn) scanAnotherBtn.addEventListener("click", () => {});
      if (viewSealBtn) viewSealBtn.addEventListener("click", () => { setView("request"); loadEquipment(); });

      const versionEl = document.getElementById("appVersion");
      if (versionEl && window.__APP_VERSION__) versionEl.textContent = window.__APP_VERSION__;

      loadEquipment();
      updateSealAppliedView();
      if (sealList.children.length === 0) addSealRow("");
    }).withFailureHandler(err => {
      console.log("[init] getUserContext FAILED", err && err.message);
      revealMainTabs();
      var bootSub = document.getElementById("bootLoadingSubtitle");
      if (bootSub) bootSub.textContent = "Failed to load. Please refresh the page.";
    }).getUserContext();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

window.__APP_JS_LOADED = true;
window.__APP_VERSION__ = "20260414_client_wrap";
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

  function markAppJsLoaded() {
    if (document.getElementById("appJsLoadedBanner")) return;
    const banner = document.createElement("div");
    banner.id = "appJsLoadedBanner";
    banner.textContent = "app.js loaded";
    banner.style.cssText = [
      "position:fixed",
      "bottom:8px",
      "right:8px",
      "background:#1b5e20",
      "color:#fff",
      "padding:4px 8px",
      "border-radius:6px",
      "font-size:12px",
      "z-index:9999",
      "opacity:0.85"
    ].join(";");
    document.body.appendChild(banner);
  }

  window.__APP_JS_LOADED = true;
  console.log("app.js loaded", { pageParams: window.PAGE_PARAMS || null, version: window.__APP_VERSION__ });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markAppJsLoaded);
  } else {
    markAppJsLoaded();
  }

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
    finalizeSuccess: document.getElementById("finalizeSuccessView")
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
      if (snackbar && typeof snackbar.show === "function") { snackbar.labelText = text; snackbar.open = true; return; }
      if (snackbar && "open" in snackbar) { snackbar.labelText = text; snackbar.open = true; return; }
    } catch (e) { /* fallback */ }
    try { window.alert(text); } catch (e) { /* ignore */ }
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

  // ==================== VIEW SWITCHING ====================
  function setView(view) {
    console.log("[setView]", view);
    Object.values(viewMap).forEach(v => { if (v) v.classList.add("hidden"); });
    const target = viewMap[view] || viewMap.request;
    if (target) target.classList.remove("hidden");
    if (mainTabs) {
      if (view === "request" || view === "requestSuccess") mainTabs.activeTabIndex = 0;
      if (view === "process" || view === "finalizeSuccess") mainTabs.activeTabIndex = 1;
      if (view === "initial" || view === "initialSuccess") mainTabs.activeTabIndex = 2;
      if (view === "unregistered") {
        const r = currentRole || "";
        mainTabs.activeTabIndex = (r === "INITIAL_SEAL" || r === "ADMIN") ? 2 : 0;
      }
    }
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
          if (!notifiedNotRegistered) { showToast("Not registered"); notifiedNotRegistered = true; }
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
          showFriendlyError(err);
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

    try {
      google.script.run
        .withSuccessHandler(function (data) { clearTimeout(timeoutId); handleEquipmentData(data); })
        .withFailureHandler(function (err) { clearTimeout(timeoutId); handleEquipmentError(err); })
        .getEquipmentDataClient(eq);
    } catch (callErr) {
      clearTimeout(timeoutId);
      responded = true;
      console.error("[loadEquipment] call threw:", callErr);
      setView("request");
      if (requestSubtitle) requestSubtitle.textContent = "Error calling server: " + (callErr.message || callErr);
    }
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
      showToast("No equipment ID in URL (eq=...)");
    }

    google.script.run.withSuccessHandler(ctx => {
      currentRole = ctx.role;
      currentEmail = ctx.email || "";
      console.log("[init] role=" + ctx.role + " email=" + ctx.email);
      userChip.setAttribute("label", ctx.email);
      setRequesterEmail(ctx.email);

      const page = getParam("page") || "request";
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
          if (currentRole !== "INITIAL_SEAL" && currentRole !== "ADMIN") { showToast("Not authorized"); return; }
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
      if (scanAnotherBtn) scanAnotherBtn.addEventListener("click", () => showToast("Scan another unit QR to begin."));
      if (viewSealBtn) viewSealBtn.addEventListener("click", () => { setView("request"); loadEquipment(); });

      const versionEl = document.getElementById("appVersion");
      if (versionEl && window.__APP_VERSION__) versionEl.textContent = window.__APP_VERSION__;

      loadEquipment();
      updateSealAppliedView();
      if (sealList.children.length === 0) addSealRow("");
    }).withFailureHandler(err => {
      console.log("[init] getUserContext FAILED", err && err.message);
      showFriendlyError(err);
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

window.__APP_JS_LOADED = true;
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
  console.log("app.js loaded", { pageParams: window.PAGE_PARAMS || null });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markAppJsLoaded);
  } else {
    markAppJsLoaded();
  }

  const viewMap = {
    request: document.getElementById("requestView"),
    process: document.getElementById("processView"),
    initial: document.getElementById("initialView"),
    unregistered: document.getElementById("unregisteredView"),
    inProgress: document.getElementById("inProgressView"),
    initialSuccess: document.getElementById("initialSuccessView"),
    requestSuccess: document.getElementById("requestSuccessView"),
    finalizeSuccess: document.getElementById("finalizeSuccessView")
  };

  const mainTabs = document.getElementById("mainTabs");
  const tabRequest = document.getElementById("tabRequest");
  const tabProcess = document.getElementById("tabProcess");
  const tabInitial = document.getElementById("tabInitial");
  const userChip = document.getElementById("userChip");
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
  const backHomeBtnDup = document.getElementById("backHomeBtnDup");
  const scanAnotherBtn = document.getElementById("scanAnotherBtn");
  const requestRef = document.getElementById("requestRef");
  const viewSealBtn = document.getElementById("viewSealBtn");
  const backHomeBtn = document.getElementById("backHomeBtn");
  const downloadSummaryBtn = document.getElementById("downloadSummaryBtn");
  const closeFinalizeBtn = document.getElementById("closeFinalizeBtn");

  const submitBtn = document.getElementById("submitBtn");
  const clearBtn = document.getElementById("clearBtn");
  const finalizeBtn = document.getElementById("finalizeBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const urlParams = new URLSearchParams(window.location.search || "");
  let currentRole = null;
  let currentEmail = "";
  let notifiedNotRegistered = false;
  let isUnregistered = false;

  function showToast(message) {
    snackbar.labelText = message;
    snackbar.open = true;
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

  function setView(view) {
    Object.values(viewMap).forEach(v => v.classList.add("hidden"));
    if (viewMap[view]) viewMap[view].classList.remove("hidden");
    if (mainTabs) {
      if (view === "request") mainTabs.activeTabIndex = 0;
      if (view === "process") mainTabs.activeTabIndex = 1;
      if (view === "initial") mainTabs.activeTabIndex = 2;
    }
  }

  function lockEquipmentField(value) {
    if (!value) return;
    const apply = () => {
      reqEquipment.value = value;
      reqEquipment.setAttribute("value", value);
      reqEquipment.disabled = true;
      reqEquipment.readOnly = true;
    };
    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined("md-filled-text-field").then(apply);
    } else {
      apply();
    }
  }

  function setInitEquipmentField(value) {
    if (!value) return;
    const apply = () => {
      initEquipment.value = value;
      initEquipment.setAttribute("value", value);
    };
    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined("md-filled-text-field").then(apply);
    } else {
      apply();
    }
  }

  function setRequesterEmail(value) {
    if (!value) return;
    const apply = () => {
      reqEmail.value = value;
      reqEmail.setAttribute("value", value);
      reqEmail.disabled = true;
      reqEmail.readOnly = true;
    };
    if (window.customElements && customElements.whenDefined) {
      customElements.whenDefined("md-filled-text-field").then(apply);
    } else {
      apply();
    }
  }

  function setTabsForRole(role) {
    tabRequest.style.display = "none";
    tabProcess.style.display = "none";
    tabInitial.style.display = "none";
    if (role === "CONTRACTOR") tabRequest.style.display = "";
    if (role === "PROCESSOR") {
      tabRequest.style.display = "";
      tabProcess.style.display = "";
    }
    if (role === "INITIAL_SEAL") {
      tabInitial.style.display = "";
      tabProcess.style.display = "";
    }
    if (role === "ADMIN") {
      tabRequest.style.display = "";
      tabProcess.style.display = "";
      tabInitial.style.display = "";
    }
  }

  function setTabDisabled(tab, disabled) {
    if (!tab) return;
    tab.classList.toggle("tab-disabled", !!disabled);
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

  function renderProcessSummary(req) {
    processSubtitle.textContent = `Request ID: ${req.RequestId}`;
    processStatus.innerHTML = "";
    const statusChip = document.createElement("md-assist-chip");
    statusChip.className = "status-chip";
    statusChip.setAttribute("label", req.Status || "PENDING");
    processStatus.appendChild(statusChip);

    processSummary.innerHTML = "";
    [
      ["Equipment ID", req.EquipmentId],
      ["Requester", `${req.Name} (${req.Company})`],
      ["Phone", req.Phone],
      ["Reason", req.Reason]
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "kv-item";
      item.innerHTML = `<div class="kv-label">${label}</div><div class="kv-value">${value || ""}</div>`;
      processSummary.appendChild(item);
    });

    processSeals.innerHTML = "";
    const selected = JSON.parse(req.SelectedOldSeals || "[]");
    selected.forEach(seal => {
      const chip = document.createElement("md-assist-chip");
      chip.setAttribute("label", seal);
      processSeals.appendChild(chip);
    });

    mappingList.innerHTML = "";
    selected.forEach(seal => {
      const row = document.createElement("div");
      row.className = "row two";
      row.innerHTML = `
        <md-assist-chip label="${seal}"></md-assist-chip>
        <md-outlined-text-field class="mapping-field" data-old="${seal}" label="New seal for ${seal}" supporting-text="Required"></md-outlined-text-field>
      `;
      mappingList.appendChild(row);
    });
  }

  function showProcessEmpty(message, rid) {
    const suffix = rid ? ` (${rid})` : "";
    processSubtitle.textContent = (message || "Request details unavailable.") + suffix;
    processStatus.innerHTML = "";
    processSummary.innerHTML = "";
    processSeals.innerHTML = "";
    mappingList.innerHTML = "";
  }

  function updateSealAppliedView() {
    const selected = newSealSeg.querySelector(".segmented-btn[aria-pressed='true']");
    const value = selected ? selected.value : "No";
    const show = value === "Yes";
    mappingSection.classList.toggle("hidden", !show);
    dateInitialsRow.classList.toggle("hidden", !show);
    mappingList.querySelectorAll(".mapping-field").forEach(field => {
      field.disabled = !show;
      if (!show) field.value = "";
    });
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

  function addSealRow(value = "") {
    const row = document.createElement("div");
    row.className = "seal-row";
    row.innerHTML = `
      <md-outlined-text-field class="seal-input" label="Seal ID" value="${value}" supporting-text="Required"></md-outlined-text-field>
      <button class="icon-btn seal-remove" aria-label="Remove seal">
        <span class="material-symbols-outlined" aria-hidden="true">delete</span>
        <span class="tooltip">Remove</span>
      </button>
    `;
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
    rows.forEach(row => {
      const removeBtn = row.querySelector(".seal-remove");
      removeBtn.disabled = rows.length <= 1;
    });
  }

  addSealBtn.addEventListener("click", () => addSealRow(""));

  function collectSealIds() {
    const values = Array.from(sealList.querySelectorAll(".seal-input"))
      .map(input => input.value.trim())
      .filter(Boolean);
    const duplicates = values.filter((v, i, arr) => arr.indexOf(v) !== i);
    sealList.querySelectorAll(".seal-input").forEach(input => {
      if (duplicates.includes(input.value.trim())) {
        input.setAttribute("error", "");
        input.setAttribute("supporting-text", "Duplicate");
      } else {
        input.removeAttribute("error");
        input.setAttribute("supporting-text", "Required");
      }
    });
    return { values, duplicates };
  }

  saveInitialBtn.addEventListener("click", () => {
    const { values, duplicates } = collectSealIds();
    if (duplicates.length) {
      showToast("Duplicate seal IDs detected");
      return;
    }
    google.script.run
      .withSuccessHandler(() => {
        setView("initialSuccess");
      })
      .withFailureHandler(err => showToast(err.message || err))
      .initialSealSave({
        equipmentId: initEquipment.value,
        dateL2: initDateL2.value,
        remarks: initRemarks.value,
        seals: values
      });
  });

  submitBtn.addEventListener("click", () => {
    const selectedSeals = getSelectedSeals();
    const equipmentId = reqEquipment.value || getParam("eq");
    if (!equipmentId || !selectedSeals.length) {
      showToast("Select at least one seal");
      return;
    }
    if (!reqReason.value.trim() || !reqName.value.trim() || !reqCompany.value.trim() || !reqPhone.value.trim()) {
      showToast("Fill all required fields");
      return;
    }
    google.script.run
      .withSuccessHandler(res => {
        if (requestRef) requestRef.textContent = `Ref ID: ${res.requestId} recorded.`;
        setView("requestSuccess");
      })
      .withFailureHandler(err => showToast(err.message || err))
      .submitRequest({
        equipmentId,
        selectedSeals,
        reason: reqReason.value,
        name: reqName.value,
        company: reqCompany.value,
        phone: reqPhone.value
      });
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      reqReason.value = "";
      reqName.value = "";
      reqCompany.value = "";
      reqPhone.value = "";
      sealChips.querySelectorAll("md-filter-chip[selected]").forEach(chip => {
        chip.removeAttribute("selected");
      });
    });
  }

  finalizeBtn.addEventListener("click", () => {
    const selected = newSealSeg.querySelector(".segmented-btn[aria-pressed='true']");
    const newSealApplied = selected ? selected.value : "No";
    if (!removalDate.value || !processRemarks.value.trim()) {
      showToast("Date of removal and remarks required");
      return;
    }
    if (newSealApplied === "Yes" && !dateInitialsField.value.trim()) {
      showToast("Date / Initials required for new seals");
      return;
    }
    const mapping = {};
    mappingList.querySelectorAll(".mapping-field").forEach(field => {
      mapping[field.dataset.old] = field.value.trim();
    });
    if (newSealApplied === "Yes") {
      const missing = Object.values(mapping).some(v => !v);
      if (missing) {
        showToast("Provide a new seal ID for each old seal");
        return;
      }
    }

    google.script.run
      .withSuccessHandler(() => {
        setView("finalizeSuccess");
      })
      .withFailureHandler(err => showToast(err.message || err))
      .finalizeRequest({
        requestId: PAGE_PARAMS.rid,
        newSealApplied,
        removalDate: removalDate.value,
        dateInitials: dateInitialsField.value,
        remarks: processRemarks.value,
        mapping
      });
  });

  cancelBtn.addEventListener("click", () => {
    if (!processRemarks.value.trim()) {
      showToast("Remarks required to cancel");
      return;
    }
    google.script.run
      .withSuccessHandler(() => showToast("Request cancelled"))
      .withFailureHandler(err => showToast(err.message || err))
      .cancelRequest({
        requestId: PAGE_PARAMS.rid,
        remarks: processRemarks.value
      });
  });

  function loadRequest() {
    const rid = getParam("rid");
    if (!rid) {
      showProcessEmpty("No request ID in URL.", rid);
      return;
    }
    google.script.run
      .withSuccessHandler(req => {
        if (!req || !req.RequestId) {
          showProcessEmpty("Request details unavailable.", rid);
          return;
        }
        if (req._error) {
          showProcessEmpty(req._error + ` (Sheet: ${req._sheetName})`, rid);
          return;
        }
        renderProcessSummary(req);
      })
      .withFailureHandler(err => {
        showFriendlyError(err);
        const message = (err && err.message) ? err.message : String(err || "");
        showProcessEmpty(message || "Request details unavailable.", rid);
        google.script.run.withSuccessHandler(info => {
          const hint = info && info.recent ? info.recent.join(", ") : "";
          const sheetLine = info ? `Sheet: ${info.spreadsheetName || ""} (${info.sheetId || ""})` : "";
          if (hint || sheetLine) {
            processSubtitle.textContent = `${processSubtitle.textContent} | ${sheetLine}${hint ? " | Recent IDs: " + hint : ""}`;
          }
        }).getRequestDebug(rid);
      })
      .getRequest(rid);
  }

  function loadEquipment() {
    const eq = getParam("eq");
    if (!eq) return;
    lockEquipmentField(eq);
    setInitEquipmentField(eq);
    if (unregisteredSubtitle) unregisteredSubtitle.textContent = `Equipment: ${eq}`;
    google.script.run
      .withSuccessHandler(data => {
        const role = currentRole || "CONTRACTOR";
        const canInitial = role === "INITIAL_SEAL" || role === "ADMIN";
        const isRegistered = (typeof data.isRegistered === "boolean")
          ? data.isRegistered
          : !!data.hasInitialSeal;

        lockEquipmentField(data.equipmentId);
        setInitEquipmentField(data.equipmentId);
        const dateText = data.dateL2 ? ` • L2: ${data.dateL2}` : "";
        requestSubtitle.textContent = `Equipment: ${data.equipmentId}${dateText}`;
        initialSubtitle.textContent = `Equipment: ${data.equipmentId}`;
        if (unregisteredSubtitle) unregisteredSubtitle.textContent = `Equipment: ${data.equipmentId}`;

        if (data.pendingRequest && currentRole === "CONTRACTOR") {
          const requester = data.pendingRequest.name || "Another contractor";
          const company = data.pendingRequest.company ? ` from ${data.pendingRequest.company}` : "";
          const createdAt = data.pendingRequest.createdAt ? `Submitted at: ${data.pendingRequest.createdAt}` : "";
          if (inProgressSubtitle) inProgressSubtitle.textContent = `Equipment: ${data.equipmentId}`;
          if (inProgressBody) {
            inProgressBody.textContent = `A request for this seal was already submitted by ${requester}${company}. The CxA and EM have already been notified.`;
          }
          if (inProgressMeta) {
            inProgressMeta.textContent = createdAt || "Scanning a different unit? Just scan its QR code to begin.";
          }
          setView("inProgress");
          setTabDisabled(tabRequest, true);
          return;
        }

        if (!isRegistered) {
          isUnregistered = true;
          renderSealChips([]);
          submitBtn.disabled = true;
          if (!notifiedNotRegistered) {
            showToast("Not registered");
            notifiedNotRegistered = true;
          }
          if (unregisteredActions) {
            if (registerInitialBtn) registerInitialBtn.style.display = canInitial ? "" : "none";
            if (backRequestBtn) backRequestBtn.style.display = canInitial ? "" : "none";
            if (contactOwnerBtn) contactOwnerBtn.style.display = canInitial ? "none" : "";
            if (refreshUnregBtn) refreshUnregBtn.style.display = canInitial ? "none" : "";
          }
          setView("unregistered");
          setTabDisabled(tabRequest, !canInitial);
          return;
        }

        isUnregistered = false;
        setTabDisabled(tabRequest, false);
        submitBtn.disabled = false;
        renderSealChips(data.currentSeals || []);
      })
      .withFailureHandler(err => {
        const message = (err && err.message) ? err.message : String(err || "");
        showFriendlyError(err);
        if (message.toLowerCase().includes("equipment id not found")) {
          submitBtn.disabled = true;
          if (unregisteredSubtitle) unregisteredSubtitle.textContent = `Equipment: ${eq}`;
          if (unregisteredActions) {
            if (registerInitialBtn) registerInitialBtn.style.display = "none";
            if (backRequestBtn) backRequestBtn.style.display = "none";
            if (contactOwnerBtn) contactOwnerBtn.style.display = "";
            if (refreshUnregBtn) refreshUnregBtn.style.display = "";
          }
          setView("unregistered");
        }
      })
      .getEquipmentData(eq);
  }

  function init() {
    const eqPrefill = getParam("eq");
    if (eqPrefill) {
      lockEquipmentField(eqPrefill);
      setInitEquipmentField(eqPrefill);
      requestSubtitle.textContent = `Equipment: ${eqPrefill}`;
      initialSubtitle.textContent = `Equipment: ${eqPrefill}`;
    } else {
      showToast("No equipment ID in URL (eq=...)");
    }
    google.script.run.withSuccessHandler(ctx => {
      currentRole = ctx.role;
      currentEmail = ctx.email || "";
      userChip.setAttribute("label", ctx.email);
      setRequesterEmail(ctx.email);
      setTabsForRole(ctx.role);

      const page = getParam("page") || "request";
      const role = ctx.role;
      const canRequest = role === "CONTRACTOR" || role === "PROCESSOR" || role === "ADMIN";
      const canProcess = role === "PROCESSOR" || role === "INITIAL_SEAL" || role === "ADMIN";
      const canInitial = role === "INITIAL_SEAL" || role === "ADMIN";

      if (page === "process") {
        if (canProcess) {
          setView("process");
          loadRequest();
        } else {
          showToast("Not authorized");
          setView(canRequest ? "request" : "initial");
        }
      } else if (page === "initial") {
        if (canInitial) {
          setView("initial");
        } else {
          showToast("Not authorized");
          setView(canRequest ? "request" : "process");
        }
      } else {
        if (role === "INITIAL_SEAL") {
          setView("initial");
        } else
        if (canRequest) {
          setView("request");
        } else if (canInitial) {
          showToast("Not authorized");
          setView("initial");
        } else if (canProcess) {
          showToast("Not authorized");
          setView("process");
        }
      }

      tabRequest.addEventListener("click", () => setView("request"));
      tabProcess.addEventListener("click", () => {
        setView("process");
        loadRequest();
      });
      tabInitial.addEventListener("click", () => setView("initial"));
      if (registerInitialBtn) {
        registerInitialBtn.addEventListener("click", () => {
          const canInitial = currentRole === "INITIAL_SEAL" || currentRole === "ADMIN";
          if (!canInitial) {
            showToast("Not authorized");
            return;
          }
          setView("initial");
        });
      }
      if (contactOwnerBtn && contactModal) {
        contactOwnerBtn.addEventListener("click", () => {
          const eq = getParam("eq");
          if (contactMailto) {
            const subject = encodeURIComponent("Initial Seal registration needed");
            const body = encodeURIComponent(`Please register initial seal for equipment: ${eq}`);
            contactMailto.setAttribute("href", `mailto:?subject=${subject}&body=${body}`);
          }
          contactModal.classList.remove("hidden");
        });
      }
      if (closeContactBtn && contactModal) {
        closeContactBtn.addEventListener("click", () => contactModal.classList.add("hidden"));
      }
      if (contactMailto && contactModal) {
        contactMailto.addEventListener("click", () => contactModal.classList.add("hidden"));
      }
      if (refreshUnregBtn) {
        refreshUnregBtn.addEventListener("click", () => loadEquipment());
      }
      if (backRequestBtn) {
        backRequestBtn.addEventListener("click", () => setView("request"));
      }
      if (backHomeBtnDup) {
        backHomeBtnDup.addEventListener("click", () => setView("request"));
      }
      if (scanAnotherBtn) {
        scanAnotherBtn.addEventListener("click", () => showToast("Scan another unit QR to begin."));
      }
      if (viewSealBtn) {
        viewSealBtn.addEventListener("click", () => {
          setView("request");
          loadEquipment();
        });
      }
      if (backHomeBtn) {
        backHomeBtn.addEventListener("click", () => setView("request"));
      }
      if (downloadSummaryBtn) {
        downloadSummaryBtn.addEventListener("click", () => showToast("Summary download not configured yet."));
      }
      if (closeFinalizeBtn) {
        closeFinalizeBtn.addEventListener("click", () => setView("process"));
      }

      loadEquipment();
      updateSealAppliedView();
      if (sealList.children.length === 0) addSealRow("");
    }).withFailureHandler(err => {
      showFriendlyError(err);
      setView("request");
    }).getUserContext();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

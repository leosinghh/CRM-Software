// ----- Local storage helpers -----

const STORAGE_KEYS = {
  DEALS: "influenceflow_deals",
  TASKS: "influenceflow_tasks",
};

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ----- State -----

let deals = loadJSON(STORAGE_KEYS.DEALS, []);
let tasks = loadJSON(STORAGE_KEYS.TASKS, {
  todo: [],
  inprogress: [],
  done: [],
});

let dealsView = "table"; // "table" | "board"
let toastTimeout = null;

// ----- Utility functions -----

function formatCurrency(value) {
  const num = Number(value) || 0;
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatPercent(value) {
  const num = Number(value) || 0;
  return num.toFixed(1) + "%";
}

function computeROI(spend, revenue) {
  const s = Number(spend) || 0;
  const r = Number(revenue) || 0;
  if (s <= 0) return 0;
  return ((r - s) / s) * 100;
}

function safeId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return "id_" + Math.random().toString(36).slice(2);
}

function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("visible");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    el.classList.remove("visible");
  }, 2000);
}

// ----- Navigation -----

function initNavigation() {
  const buttons = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".section");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      sections.forEach((section) => {
        section.classList.toggle("visible", section.id === target);
      });
    });
  });
}

// ----- Deals / pipeline -----

function getFilteredDeals() {
  const statusFilter = document.getElementById("filter-status").value;
  const searchText = document
    .getElementById("filter-search")
    .value.trim()
    .toLowerCase();

  let filtered = deals.slice();

  if (statusFilter) {
    filtered = filtered.filter((d) => d.status === statusFilter);
  }

  if (searchText) {
    filtered = filtered.filter((d) => {
      return (
        (d.brand || "").toLowerCase().includes(searchText) ||
        (d.creator || "").toLowerCase().includes(searchText) ||
        (d.platform || "").toLowerCase().includes(searchText)
      );
    });
  }

  return filtered;
}

function renderKPIs() {
  const totalSpend = deals.reduce(
    (sum, d) => sum + (Number(d.spend) || 0),
    0
  );
  const totalRevenue = deals.reduce(
    (sum, d) => sum + (Number(d.revenue) || 0),
    0
  );
  const roi = computeROI(totalSpend, totalRevenue);

  const activeStatuses = ["Planning", "Live"];
  const completedStatus = "Completed";

  const activeCount = deals.filter((d) =>
    activeStatuses.includes(d.status)
  ).length;
  const completedCount = deals.filter(
    (d) => d.status === completedStatus
  ).length;

  let topDeal = null;
  deals.forEach((d) => {
    const dealRoi = computeROI(d.spend, d.revenue);
    if (topDeal == null || dealRoi > topDeal.roi) {
      topDeal = { name: `${d.brand} × ${d.creator}`, roi: dealRoi };
    }
  });

  document.getElementById("kpi-spend").textContent =
    formatCurrency(totalSpend);
  document.getElementById("kpi-revenue").textContent =
    formatCurrency(totalRevenue);
  document.getElementById("kpi-roi").textContent = formatPercent(roi);

  document.getElementById(
    "kpi-spend-sub"
  ).textContent = `${activeCount} active deals`;
  document.getElementById(
    "kpi-revenue-sub"
  ).textContent = `${completedCount} completed deals`;

  document.getElementById("kpi-roi-sub").textContent = topDeal
    ? `Top deal: ${topDeal.name}`
    : "Top deal: —";
}

function statusTagClass(status) {
  switch (status) {
    case "Planning":
      return "tag-planning";
    case "Live":
      return "tag-live";
    case "Completed":
      return "tag-completed";
    case "Cancelled":
      return "tag-cancelled";
    default:
      return "tag-planning";
  }
}

function initialsFromBrand(brand) {
  if (!brand) return "?";
  const parts = brand.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function renderDealsTable() {
  const tbody = document.getElementById("deals-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = getFilteredDeals();

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = "No deals yet. Add your first collaboration on the right.";
    td.style.color = "var(--text-muted)";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((deal) => {
    const tr = document.createElement("tr");
    const roi = computeROI(deal.spend, deal.revenue);

    const tagClass = statusTagClass(deal.status);

    tr.innerHTML = `
      <td>
        <div class="deal-cell">
          <div class="deal-avatar">${initialsFromBrand(deal.brand)}</div>
          <div class="deal-text">
            <span class="deal-main">${deal.brand || ""}</span>
            <span class="deal-sub">${deal.creator || ""}</span>
          </div>
        </div>
      </td>
      <td>${deal.platform || ""}</td>
      <td><span class="tag ${tagClass}">${deal.status}</span></td>
      <td>${formatCurrency(deal.spend)}</td>
      <td>${formatCurrency(deal.revenue)}</td>
      <td>${formatPercent(roi)}</td>
      <td>
        <button class="btn small ghost" data-edit="${deal.id}">Edit</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const deal = deals.find((d) => d.id === id);
      if (deal) {
        fillDealForm(deal);
      }
    });
  });
}

function columnSpecForStatus(status) {
  switch (status) {
    case "Planning":
      return { title: "Planning", key: "Planning" };
    case "Live":
      return { title: "Live", key: "Live" };
    case "Completed":
      return { title: "Completed", key: "Completed" };
    case "Cancelled":
      return { title: "Cancelled", key: "Cancelled" };
    default:
      return { title: status, key: status };
  }
}

function renderDealsBoard() {
  const container = document.getElementById("deals-board");
  if (!container) return;
  container.innerHTML = "";

  const filtered = getFilteredDeals();

  const columns = ["Planning", "Live", "Completed", "Cancelled"].map(
    (status) => ({
      status,
      deals: filtered.filter((d) => d.status === status),
    })
  );

  columns.forEach((col) => {
    const spec = columnSpecForStatus(col.status);
    const colEl = document.createElement("div");
    colEl.className = "deals-column";

    const header = document.createElement("div");
    header.className = "deals-column-header";
    header.innerHTML = `
      <span class="deals-column-title">${spec.title}</span>
      <span class="deals-column-count">${col.deals.length}</span>
    `;
    colEl.appendChild(header);

    if (!col.deals.length) {
      const empty = document.createElement("div");
      empty.className = "deal-card";
      empty.style.opacity = "0.6";
      empty.textContent = "No deals in this stage.";
      colEl.appendChild(empty);
    } else {
      col.deals.forEach((deal) => {
        const card = document.createElement("div");
        card.className = "deal-card";

        const roi = computeROI(deal.spend, deal.revenue);
        const spendText = formatCurrency(deal.spend);
        const revText = formatCurrency(deal.revenue);

        card.innerHTML = `
          <div class="deal-card-main">${deal.brand || ""}</div>
          <div class="deal-card-sub">${deal.creator || ""} · ${
          deal.platform || ""
        }</div>
          <div class="deal-card-metric">Spend ${spendText} · Rev ${revText} · ROI ${formatPercent(
          roi
        )}</div>
        `;

        colEl.appendChild(card);
      });
    }

    container.appendChild(colEl);
  });
}

function resetDealForm() {
  const form = document.getElementById("deal-form");
  if (!form) return;
  form.reset();
  document.getElementById("deal-id").value = "";
  document.getElementById("deal-form-title").textContent = "Add Deal";
  document.getElementById("delete-deal").classList.add("hidden");
}

function fillDealForm(deal) {
  document.getElementById("deal-form-title").textContent = "Edit Deal";
  document.getElementById("deal-id").value = deal.id;
  document.getElementById("brand").value = deal.brand || "";
  document.getElementById("creator").value = deal.creator || "";
  document.getElementById("platform").value = deal.platform || "";
  document.getElementById("status").value = deal.status || "Planning";
  document.getElementById("start-date").value = deal.startDate || "";
  document.getElementById("end-date").value = deal.endDate || "";
  document.getElementById("spend").value = deal.spend || "";
  document.getElementById("revenue").value = deal.revenue || "";
  document.getElementById("impressions").value = deal.impressions || "";
  document.getElementById("clicks").value = deal.clicks || "";
  document.getElementById("deliverables").value = deal.deliverables || "";
  document.getElementById("delete-deal").classList.remove("hidden");
}

function initDealForm() {
  const form = document.getElementById("deal-form");
  const resetBtn = document.getElementById("reset-deal-form");
  const deleteBtn = document.getElementById("delete-deal");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = document.getElementById("deal-id").value || safeId();
    const brand = document.getElementById("brand").value.trim();
    const creator = document.getElementById("creator").value.trim();

    if (!brand || !creator) {
      alert("Brand and creator are required.");
      return;
    }

    const deal = {
      id,
      brand,
      creator,
      platform: document.getElementById("platform").value,
      status: document.getElementById("status").value,
      startDate: document.getElementById("start-date").value,
      endDate: document.getElementById("end-date").value,
      spend: Number(document.getElementById("spend").value || 0),
      revenue: Number(document.getElementById("revenue").value || 0),
      impressions: Number(document.getElementById("impressions").value || 0),
      clicks: Number(document.getElementById("clicks").value || 0),
      deliverables: document.getElementById("deliverables").value.trim(),
    };

    const existingIndex = deals.findIndex((d) => d.id === id);
    if (existingIndex !== -1) {
      deals[existingIndex] = deal;
      showToast("Deal updated");
    } else {
      deals.push(deal);
      showToast("Deal added");
    }

    saveJSON(STORAGE_KEYS.DEALS, deals);
    renderKPIs();
    renderDealsTable();
    renderDealsBoard();
    resetDealForm();
  });

  resetBtn.addEventListener("click", () => {
    resetDealForm();
  });

  deleteBtn.addEventListener("click", () => {
    const id = document.getElementById("deal-id").value;
    if (!id) return;
    deals = deals.filter((d) => d.id !== id);
    saveJSON(STORAGE_KEYS.DEALS, deals);
    renderKPIs();
    renderDealsTable();
    renderDealsBoard();
    resetDealForm();
    showToast("Deal deleted");
  });

  document
    .getElementById("filter-status")
    .addEventListener("change", () => {
      renderDealsTable();
      renderDealsBoard();
    });
  document
    .getElementById("filter-search")
    .addEventListener("input", () => {
      renderDealsTable();
      renderDealsBoard();
    });

  // View toggle
  const viewTableBtn = document.getElementById("view-table");
  const viewBoardBtn = document.getElementById("view-board");
  const tableWrapper = document.getElementById("deals-table-wrapper");
  const boardWrapper = document.getElementById("deals-board");

  function setDealsView(view) {
    dealsView = view;
    const isTable = view === "table";
    tableWrapper.classList.toggle("hidden", !isTable);
    boardWrapper.classList.toggle("hidden", isTable);
    viewTableBtn.classList.toggle("active", isTable);
    viewBoardBtn.classList.toggle("active", !isTable);

    if (!isTable) {
      renderDealsBoard();
    }
  }

  viewTableBtn.addEventListener("click", () => setDealsView("table"));
  viewBoardBtn.addEventListener("click", () => setDealsView("board"));
}

// ----- Contract builder (template only, no AI) -----

function initContractBuilder() {
  const form = document.getElementById("contract-form");
  const output = document.getElementById("contract-output");
  const copyBtn = document.getElementById("contract-copy");
  const meta = document.getElementById("contract-meta");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const brand = document.getElementById("c-brand").value.trim();
    const creator = document.getElementById("c-creator").value.trim();
    const platforms = document.getElementById("c-platform").value.trim();
    const fee = document.getElementById("c-fee").value.trim();
    const start = document.getElementById("c-start").value;
    const end = document.getElementById("c-end").value;
    const deliverables = document
      .getElementById("c-deliverables")
      .value.trim();
    const usage = document.getElementById("c-usage").value.trim();
    const paymentTerms = document
      .getElementById("c-payment-terms")
      .value.trim();

    const includeExclusivity =
      document.getElementById("c-exclusivity").checked;
    const includeMorals = document.getElementById("c-morals").checked;
    const includeTermination =
      document.getElementById("c-termination").checked;

    if (!brand || !creator || !deliverables) {
      alert("Brand, creator, and deliverables are required.");
      return;
    }

    const period =
      start || end
        ? `${start || "start date"} – ${end || "end date"}`
        : "campaign dates to be agreed in writing";

    const feeText = fee
      ? `$${Number(fee).toLocaleString("en-US")}`
      : "the fee agreed in writing between the parties";

    const usageText =
      usage ||
      "Brand may use the approved content on its owned social channels and paid social ads for a period of six (6) months from first publication, in the primary campaign territories.";

    const paymentText =
      paymentTerms ||
      "Brand will pay Creator within thirty (30) days of receipt of a valid invoice, following approval of all Deliverables.";

    const clauses = [];

    if (includeExclusivity) {
      clauses.push(
        `Exclusivity\nCreator agrees not to promote directly competing products or services in the same category as Brand’s products during the campaign period and for thirty (30) days thereafter, unless otherwise agreed in writing.`
      );
    }

    if (includeMorals) {
      clauses.push(
        `Morals Clause\nIf Creator engages in conduct that, in Brand’s reasonable opinion, is likely to bring Brand into material disrepute, Brand may request removal of related content and may terminate this Agreement with immediate effect.`
      );
    }

    if (includeTermination) {
      clauses.push(
        `Termination\nEither Party may terminate this Agreement in writing if the other Party materially breaches its obligations and fails to remedy such breach within a reasonable cure period, or immediately in the case of a serious breach of law or platform policy.`
      );
    }

    const template = `
INFLUENCE MARKETING SERVICES AGREEMENT

This Influence Marketing Services Agreement ("Agreement") is entered into between:

- Brand / Advertiser: ${brand}
- Creator / Talent: ${creator}

(collectively, the "Parties").

1. Scope of Work
Creator agrees to create and publish the following deliverables (the "Deliverables") in relation to Brand's products and/or services:
${deliverables}

2. Platforms and Campaign Period
The Deliverables will be published on the following platform(s): ${platforms || "platforms to be agreed"}.
The campaign period is: ${period}.

3. Compensation
In consideration for the Deliverables and rights granted herein, Brand agrees to pay Creator a total fee of ${feeText}, exclusive of any applicable taxes and fees, unless otherwise agreed.

4. Usage Rights
${usageText}

No rights are granted beyond those explicitly set out above. Any additional usage, platforms, territories, or durations must be agreed in writing and may be subject to additional fees.

5. Content Approval
Creator will submit draft Deliverables to Brand for review prior to publication. Brand may request reasonable edits to ensure factual accuracy and brand safety, without materially changing Creator's voice or style.

6. Compliance and Disclosures
Creator will comply with all applicable advertising, consumer protection, and platform-specific rules, including the use of clear and conspicuous disclosure tags such as #ad or #sponsored where required.

7. Payment Terms
${paymentText}

${clauses.length ? clauses.map((c, i) => `${8 + i}. ${c}`).join("\n\n") + "\n\n" : ""}Governing Law
This Agreement will be governed by and construed in accordance with the laws of the jurisdiction mutually agreed by the Parties in writing.

AGREED AND ACCEPTED:

Brand: _____________________________    Date: __________________

Creator: ___________________________    Date: __________________
`.trim();

    output.value = template;
    meta.textContent = `${brand} × ${creator} • ${feeText}`;
    showToast("Contract generated");
  });

  copyBtn.addEventListener("click", () => {
    output.select();
    document.execCommand("copy");
    showToast("Contract copied to clipboard");
  });
}

// ----- Tasks (simple kanban) -----

function renderTasks() {
  ["todo", "inprogress", "done"].forEach((status) => {
    const listEl = document.getElementById(`${status}-list`);
    if (!listEl) return;
    listEl.innerHTML = "";

    const items = tasks[status] || [];

    if (!items.length) {
      listEl.classList.add("empty");
    } else {
      listEl.classList.remove("empty");
    }

    items.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task";
      li.draggable = true;
      li.dataset.id = task.id;
      li.dataset.status = status;

      let title = task.title || "";
      let tag = null;
      const colonIndex = title.indexOf(":");
      if (colonIndex > 0 && colonIndex <= 14) {
        tag = title.slice(0, colonIndex).trim();
        title = title.slice(colonIndex + 1).trim();
      }

      li.innerHTML = `
        <div class="task-main">
          ${
            tag
              ? `<span class="task-tag">${tag}</span>`
              : ""
          }
          <span class="task-title">${title}</span>
        </div>
        <div class="task-controls">
          <button class="task-delete" title="Remove">×</button>
        </div>
      `;

      li
        .querySelector(".task-delete")
        .addEventListener("click", () => deleteTask(status, task.id));

      li.addEventListener("dragstart", onTaskDragStart);
      li.addEventListener("dragend", onTaskDragEnd);

      listEl.appendChild(li);
    });
  });

  updateTaskCounts();
}

function updateTaskCounts() {
  const statuses = ["todo", "inprogress", "done"];
  statuses.forEach((status) => {
    const count = (tasks[status] || []).length;
    const el = document.getElementById(`${status}-count`);
    if (el) {
      el.textContent = `• ${count}`;
    }
  });
}

function deleteTask(status, id) {
  tasks[status] = tasks[status].filter((t) => t.id !== id);
  saveJSON(STORAGE_KEYS.TASKS, tasks);
  renderTasks();
}

let draggedTask = null;

function onTaskDragStart(e) {
  draggedTask = {
    id: e.target.dataset.id,
    from: e.target.dataset.status,
  };
  e.dataTransfer.effectAllowed = "move";
  e.target.classList.add("dragging");
}

function onTaskDragEnd(e) {
  e.target.classList.remove("dragging");
  draggedTask = null;
}

function initTaskBoard() {
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const focusBtn = document.getElementById("todo-focus");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    const newTask = {
      id: safeId(),
      title,
    };
    tasks.todo.push(newTask);
    saveJSON(STORAGE_KEYS.TASKS, tasks);
    input.value = "";
    renderTasks();
  });

  focusBtn.addEventListener("click", () => {
    input.focus();
  });

  ["todo", "inprogress", "done"].forEach((status) => {
    const listEl = document.getElementById(`${status}-list`);

    listEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });

    listEl.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!draggedTask) return;

      const { id, from } = draggedTask;
      if (!tasks[from]) return;

      const taskIndex = tasks[from].findIndex((t) => t.id === id);
      if (taskIndex === -1) return;

      const [task] = tasks[from].splice(taskIndex, 1);
      tasks[status].push(task);

      saveJSON(STORAGE_KEYS.TASKS, tasks);
      renderTasks();
    });
  });
}

// ----- Demo mode -----

function seedDemoData() {
  const confirmOverwrite =
    deals.length || tasks.todo.length || tasks.inprogress.length || tasks.done.length
      ? confirm(
          "Demo mode will overwrite existing local data for deals and tasks. Continue?"
        )
      : true;

  if (!confirmOverwrite) return;

  deals = [
    {
      id: safeId(),
      brand: "Glossier",
      creator: "@beautybyjane",
      platform: "Instagram",
      status: "Completed",
      startDate: "2025-05-01",
      endDate: "2025-05-20",
      spend: 12000,
      revenue: 42000,
      impressions: 480000,
      clicks: 18000,
      deliverables: "2x Reels, 4x Stories, UGC whitelisting for 6 months.",
    },
    {
      id: safeId(),
      brand: "Nike Running",
      creator: "@runwithmax",
      platform: "TikTok",
      status: "Live",
      startDate: "2025-06-10",
      endDate: "2025-07-10",
      spend: 15000,
      revenue: 0,
      impressions: 320000,
      clicks: 9200,
      deliverables: "3x TikTok, 2x IG Story, 1x recap vlog.",
    },
    {
      id: safeId(),
      brand: "Oatly",
      creator: "@latte.liz",
      platform: "Instagram",
      status: "Planning",
      startDate: "",
      endDate: "",
      spend: 8000,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      deliverables: "2x static posts, 3x Story frames, newsletter feature.",
    },
    {
      id: safeId(),
      brand: "Notion",
      creator: "@studywithsof",
      platform: "YouTube",
      status: "Completed",
      startDate: "2025-03-01",
      endDate: "2025-03-15",
      spend: 9000,
      revenue: 21000,
      impressions: 260000,
      clicks: 6700,
      deliverables: "1x sponsored video, 1x IG Reel, 2x Stories.",
    },
  ];

  tasks = {
    todo: [
      { id: safeId(), title: "Glossier: approve final story concepts" },
      { id: safeId(), title: "Nike Running: send tracking links" },
    ],
    inprogress: [
      { id: safeId(), title: "Oatly: draft contract with usage rights" },
    ],
    done: [
      { id: safeId(), title: "Notion: reconcile invoice + payout" },
    ],
  };

  saveJSON(STORAGE_KEYS.DEALS, deals);
  saveJSON(STORAGE_KEYS.TASKS, tasks);

  renderKPIs();
  renderDealsTable();
  renderDealsBoard();
  renderTasks();

  showToast("Demo data loaded");
}

function initDemoMode() {
  const btn = document.getElementById("demo-mode");
  if (!btn) return;
  btn.addEventListener("click", seedDemoData);
}

// ----- Init -----

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initDealForm();
  initContractBuilder();
  initTaskBoard();
  initDemoMode();

  renderKPIs();
  renderDealsTable();
  renderDealsBoard();
  renderTasks();
});

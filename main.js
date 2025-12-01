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

function renderKPIs() {
  const spend = deals.reduce((sum, d) => sum + (Number(d.spend) || 0), 0);
  const revenue = deals.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);
  const roi = computeROI(spend, revenue);

  document.getElementById("kpi-spend").textContent = formatCurrency(spend);
  document.getElementById("kpi-revenue").textContent = formatCurrency(revenue);
  document.getElementById("kpi-roi").textContent = formatPercent(roi);
}

function renderDealsTable() {
  const tbody = document.getElementById("deals-body");
  tbody.innerHTML = "";

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

  if (!filtered.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 8;
    td.textContent = "No deals yet. Add one on the right.";
    td.style.color = "var(--text-muted)";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((deal) => {
    const tr = document.createElement("tr");

    const roi = computeROI(deal.spend, deal.revenue);

    const statusTagClass =
      deal.status === "Planning"
        ? "tag-planning"
        : deal.status === "Live"
        ? "tag-live"
        : deal.status === "Completed"
        ? "tag-completed"
        : "tag-cancelled";

    tr.innerHTML = `
      <td>${deal.brand || ""}</td>
      <td>${deal.creator || ""}</td>
      <td>${deal.platform || ""}</td>
      <td><span class="tag ${statusTagClass}">${deal.status}</span></td>
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

function resetDealForm() {
  document.getElementById("deal-form").reset();
  document.getElementById("deal-id").value = "";
  document.getElementById("deal-form-title").textContent = "Add Deal";
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
}

function initDealForm() {
  const form = document.getElementById("deal-form");
  const resetBtn = document.getElementById("reset-deal-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = document.getElementById("deal-id").value || crypto.randomUUID();
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
    } else {
      deals.push(deal);
    }

    saveJSON(STORAGE_KEYS.DEALS, deals);
    renderKPIs();
    renderDealsTable();
    resetDealForm();
  });

  resetBtn.addEventListener("click", () => {
    resetDealForm();
  });

  document
    .getElementById("filter-status")
    .addEventListener("change", renderDealsTable);
  document
    .getElementById("filter-search")
    .addEventListener("input", renderDealsTable);
}

// ----- Contract builder (template only, no AI) -----

function initContractBuilder() {
  const form = document.getElementById("contract-form");
  const output = document.getElementById("contract-output");
  const copyBtn = document.getElementById("contract-copy");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const brand = document.getElementById("c-brand").value.trim();
    const creator = document.getElementById("c-creator").value.trim();
    const platforms = document.getElementById("c-platform").value.trim();
    const fee = document.getElementById("c-fee").value.trim();
    const start = document.getElementById("c-start").value;
    const end = document.getElementById("c-end").value;
    const deliverables = document.getElementById("c-deliverables").value.trim();
    const usage = document.getElementById("c-usage").value.trim();
    const paymentTerms = document
      .getElementById("c-payment-terms")
      .value.trim();

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
      "Brand may use the approved content on its owned social channels and paid social ads for a period of six (6) months from first publication, in the territory of campaign focus.";

    const paymentText =
      paymentTerms ||
      "Brand will pay Creator within thirty (30) days of receipt of a valid invoice, following approval of all deliverables.";

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

8. Termination
Either Party may terminate this Agreement in writing if the other Party materially breaches its obligations and fails to remedy such breach within a reasonable cure period.

9. Independent Contractor
Creator performs the services as an independent contractor. Nothing in this Agreement is intended to create an employment, partnership, or joint venture relationship between the Parties.

10. Governing Law
This Agreement will be governed by and construed in accordance with the laws of the jurisdiction mutually agreed by the Parties in writing.

AGREED AND ACCEPTED:

Brand: _____________________________    Date: __________________

Creator: ___________________________    Date: __________________
`.trim();

    output.value = template;
  });

  copyBtn.addEventListener("click", () => {
    output.select();
    document.execCommand("copy");
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy to clipboard";
    }, 1200);
  });
}

// ----- Tasks (simple kanban) -----

function renderTasks() {
  ["todo", "inprogress", "done"].forEach((status) => {
    const listEl = document.getElementById(`${status}-list`);
    listEl.innerHTML = "";
    const items = tasks[status] || [];

    items.forEach((task) => {
      const li = document.createElement("li");
      li.className = "task";
      li.draggable = true;
      li.dataset.id = task.id;
      li.dataset.status = status;

      li.innerHTML = `
        <span class="task-title">${task.title}</span>
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    const newTask = {
      id: crypto.randomUUID(),
      title,
    };
    tasks.todo.push(newTask);
    saveJSON(STORAGE_KEYS.TASKS, tasks);
    input.value = "";
    renderTasks();
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

// ----- Init -----

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initDealForm();
  initContractBuilder();
  initTaskBoard();

  renderKPIs();
  renderDealsTable();
  renderTasks();
});


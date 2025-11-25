diff --git a/main.js b/main.js
new file mode 100644
index 0000000000000000000000000000000000000000..59330c8c4008ae70169191c3f51d0aed8915aa96
--- /dev/null
+++ b/main.js
@@ -0,0 +1,245 @@
+const campaigns = [
+  { name: "GlowUp Serum x @skinbyliv", spend: 3200, revenue: 12600, conversions: 420, status: "Live" },
+  { name: "Volt Fitness x @trainwithleo", spend: 2800, revenue: 9100, conversions: 310, status: "Delivering" },
+  { name: "Nomad Bags x @travelkel", spend: 1800, revenue: 2200, conversions: 70, status: "At Risk" },
+];
+
+const workspaceItems = [
+  { title: "Draft TikTok story x2", owner: "@skinbyliv", due: "2024-07-12", status: "On Track" },
+  { title: "Brand approvals for IG story swipe-up", owner: "Acme Brand", due: "2024-07-08", status: "At Risk" },
+  { title: "Post-campaign report", owner: "Agency", due: "2024-07-15", status: "Blocked" },
+];
+
+const payouts = [
+  { invoice: "INV-2045", amount: 3200, due: "2024-07-05", status: "Scheduled" },
+  { invoice: "INV-2046", amount: 1800, due: "2024-07-09", status: "Paid" },
+  { invoice: "INV-2047", amount: 2400, due: "2024-07-16", status: "Pending" },
+];
+
+const negotiationTemplates = {
+  bump: ({ rate }) => `Thanks for sharing the brief! Based on past results and usage rights, I usually quote $${rate} for a bundle like this. Happy to add a bonus Story set if we close this week.`,
+  bundles: ({ rate }) => `I'd love to pair TikTok + IG Reels so you get cross-platform reach. A bundled rate of $${rate} keeps CPC low and speeds approval.`,
+  timelines: () => "Could we confirm a 10-day approval window and 48h feedback SLA? That keeps timelines predictable for both teams.",
+};
+
+const formatCurrency = (value) => `$${value.toLocaleString()}`;
+
+function renderKPIs() {
+  const totals = campaigns.reduce(
+    (acc, c) => {
+      acc.spend += c.spend;
+      acc.revenue += c.revenue;
+      acc.conversions += c.conversions;
+      return acc;
+    },
+    { spend: 0, revenue: 0, conversions: 0 }
+  );
+
+  const roi = totals.revenue && totals.spend ? ((totals.revenue - totals.spend) / totals.spend) * 100 : 0;
+  const kpiData = [
+    { label: "Total Revenue", value: formatCurrency(totals.revenue), change: "+18% vs last 30d" },
+    { label: "Ad Spend", value: formatCurrency(totals.spend), change: "Budget burn 62%" },
+    { label: "ROI", value: `${roi.toFixed(1)}%`, change: roi > 0 ? "Healthy" : "Needs attention" },
+    { label: "Conversions", value: totals.conversions.toLocaleString(), change: "Multi-touch across IG + TikTok" },
+  ];
+
+  const kpiGrid = document.getElementById("kpiGrid");
+  kpiGrid.innerHTML = kpiData
+    .map(
+      (item) => `
+        <div class="kpi-card">
+          <div class="kpi-label">${item.label}</div>
+          <div class="kpi-value">${item.value}</div>
+          <div class="kpi-change">${item.change}</div>
+        </div>
+      `
+    )
+    .join("");
+}
+
+function renderCampaigns() {
+  const container = document.getElementById("campaignTable");
+  const header = `
+    <div class="row header">
+      <div>Collaboration</div>
+      <div>Spend</div>
+      <div>Revenue</div>
+      <div>ROI</div>
+    </div>`;
+
+  const rows = campaigns
+    .map((c) => {
+      const roi = c.revenue && c.spend ? ((c.revenue - c.spend) / c.spend) * 100 : 0;
+      const statusClass = roi >= 0 ? "success" : "danger";
+      return `
+        <div class="row">
+          <div>
+            <div><strong>${c.name}</strong></div>
+            <div class="pill ${statusClass}">${c.status}</div>
+          </div>
+          <div>${formatCurrency(c.spend)}</div>
+          <div>${formatCurrency(c.revenue)}</div>
+          <div class="pill ${statusClass}">${roi.toFixed(1)}%</div>
+        </div>`;
+    })
+    .join("");
+
+  container.innerHTML = header + rows;
+}
+
+function renderWorkspace() {
+  const container = document.getElementById("workspaceBoard");
+  const header = `
+    <div class="row header">
+      <div>Task</div>
+      <div>Owner</div>
+      <div>Due</div>
+      <div>Status</div>
+    </div>`;
+
+  const rows = workspaceItems
+    .map((item) => {
+      const statusMap = {
+        "On Track": "on-time",
+        "At Risk": "at-risk",
+        Blocked: "blocked",
+      };
+      return `
+        <div class="row">
+          <div>${item.title}</div>
+          <div>${item.owner}</div>
+          <div>${item.due}</div>
+          <div><span class="badge ${statusMap[item.status]}">${item.status}</span></div>
+        </div>`;
+    })
+    .join("");
+
+  container.innerHTML = header + rows;
+}
+
+function renderPayouts() {
+  const container = document.getElementById("payoutTable");
+  const header = `
+    <div class="row header">
+      <div>Invoice</div>
+      <div>Amount</div>
+      <div>Due</div>
+      <div>Status</div>
+    </div>`;
+
+  const rows = payouts
+    .map((item) => {
+      const statusClass = item.status === "Paid" ? "success" : item.status === "Scheduled" ? "neutral" : "danger";
+      return `
+        <div class="row">
+          <div>${item.invoice}</div>
+          <div>${formatCurrency(item.amount)}</div>
+          <div>${item.due}</div>
+          <div><span class="pill ${statusClass}">${item.status}</span></div>
+        </div>`;
+    })
+    .join("");
+
+  container.innerHTML = header + rows;
+}
+
+function handleContractForm() {
+  const form = document.getElementById("contractForm");
+  const output = document.getElementById("contractOutput");
+
+  form.addEventListener("submit", (event) => {
+    event.preventDefault();
+    const data = new FormData(form);
+    const usage = data.get("usage");
+    const deliverables = data.get("deliverables");
+    const startDate = data.get("startDate");
+    const dueDate = data.get("dueDate");
+    const contact = data.get("contact");
+
+    const contract = `COLLABORATION AGREEMENT\nParties: ${contact}\nUsage Rights: ${usage}\nDeliverables: ${deliverables}\nTimeline: ${startDate} → ${dueDate}\nFeedback SLA: 48h per round\nPayment: 50% to kick-off, 50% net-15 after delivery`;
+
+    output.textContent = contract;
+  });
+}
+
+function handleNegotiation() {
+  const select = document.getElementById("templateSelect");
+  const targetRate = document.getElementById("targetRate");
+  const messageBox = document.getElementById("messageBox");
+
+  const options = [
+    { value: "bump", label: "Upsell based on performance" },
+    { value: "bundles", label: "Bundle TikTok + IG" },
+    { value: "timelines", label: "Faster approvals" },
+  ];
+
+  select.innerHTML = options.map((o) => `<option value="${o.value}">${o.label}</option>`).join("");
+
+  document.getElementById("insertTemplate").addEventListener("click", () => {
+    const template = negotiationTemplates[select.value];
+    const rate = targetRate.value || 1500;
+    messageBox.value = template({ rate });
+  });
+
+  document.getElementById("copyMessage").addEventListener("click", () => {
+    navigator.clipboard.writeText(messageBox.value || "");
+    document.getElementById("copyMessage").textContent = "Copied";
+    setTimeout(() => (document.getElementById("copyMessage").textContent = "Copy"), 1200);
+  });
+}
+
+function handlePricingBenchmark() {
+  const form = document.getElementById("pricingForm");
+  const result = document.getElementById("pricingResult");
+
+  form.addEventListener("submit", (event) => {
+    event.preventDefault();
+    const data = new FormData(form);
+    const followers = Number(data.get("followers"));
+    const engagement = Number(data.get("engagement"));
+    const niche = data.get("niche");
+    const country = data.get("country");
+
+    const countryLift = { us: 1.2, uk: 1.15, eu: 1.05, latam: 0.8, sea: 0.75 };
+    const nicheLift = { beauty: 1.1, fitness: 1.05, tech: 1.2, food: 1, travel: 1.05 };
+
+    const baseCpm = 12 + engagement * 1.3; // proxy for quality audience
+    const estRate = Math.round((followers / 1000) * baseCpm * countryLift[country] * nicheLift[niche]);
+
+    result.innerHTML = `
+      <div><strong>Suggested rate:</strong> ${formatCurrency(estRate)}</div>
+      <ul>
+        <li>Inputs: ${followers.toLocaleString()} followers • ${engagement}% engagement</li>
+        <li>Market lift: ${country.toUpperCase()} × niche modifier (${niche})</li>
+        <li>Logic: CPM-based benchmark plus performance uplift</li>
+      </ul>`;
+  });
+}
+
+function hookRefresh() {
+  const refresh = document.getElementById("refreshCampaigns");
+  refresh.addEventListener("click", () => {
+    campaigns.push({
+      name: "FreshDrop x @studioava",
+      spend: 1500,
+      revenue: 4300,
+      conversions: 140,
+      status: "Live",
+    });
+    renderKPIs();
+    renderCampaigns();
+  });
+}
+
+function init() {
+  renderKPIs();
+  renderCampaigns();
+  renderWorkspace();
+  renderPayouts();
+  handleContractForm();
+  handleNegotiation();
+  handlePricingBenchmark();
+  hookRefresh();
+}
+
+init();
